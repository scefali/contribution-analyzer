import { type PullRequest } from './github.ts'
import { createSimpleCompletion } from './llm.ts'
import { getCache, setCache } from './redis.ts'

const MAX_DIFF_LENGTH = 1000

function getRepoFromPr(pr: PullRequest) {
	return `${pr.repository_url.split('/').slice(-2).join('/')}`
}


function getMetadataAction(pr: ReturnType<typeof getPrContentData>) {
	return {
		action: 'metadata',
		data: pr,
	} as const
}

function generateSummaryAction(summary: string, id: number) {
	return {
		action: 'summary',
		data: { text: summary, id },
	} as const
}

function getPrContentData(pr: PullRequest) {
	console.log('Getting PR content data for', pr)
	return {
		title: pr.title,
		body: pr.body,
		link: pr.html_url,
		id: pr.id,
		diffUrl: pr?.pull_request?.diff_url,
		closedAt: pr.closed_at as string, // we've already filtered out PRs that are open
		repo: getRepoFromPr(pr),
		repoLink: pr.repository_url.replace('api.github.com/repos', 'github.com'),
		prNumber: pr.number,
	}
}

export async function generateSummaryForPrs({
	name,
	prs,
	customPrompt,
	userId,
	githubCookie,
}: {
	prs: PullRequest[]
	name: string
	customPrompt?: string
	userId: number
	githubCookie: string
}) {
	const prDataArray = await Promise.all(prs.map(getPrContentData))

	// load all summaries in the cache in parallel
	const prsToFetch = await Promise.all(
		prDataArray.map(async pr => {
			const cached = await getCache(pr.id.toString())
			if (cached) {
				return { summary: cached, ...pr }
			}
			return { summary: '', ...pr }
		}),
	)

	return Promise.all(
		prsToFetch.map(async function* (pr) {
			// next try to find the cached summary if it exists
			// this can happen if there are new PRS at the top already
			if (pr.summary) {
				yield getMetadataAction(pr)
				yield generateSummaryAction(pr.summary, pr.id)
				return
			}

			// load the diff if it's avaialable on-demand
			let diff = ''
			if (pr.diffUrl) {
				const response = await fetch(pr.diffUrl)
				const diffText = await response.text()
				diff = diffText.substring(0, MAX_DIFF_LENGTH)
			}

			// Construct the prompt for OpenAI
			const prompt = `
				Create a summary of this PR based on the JSON representation of the PR below.
				The summary should be 2-3 sentences.
				${customPrompt || ''}: 

				Example:
				Adds two notification tables (NotificationSettingOption and NotificationSettingProvider). These tables are the output of splitting the exisitng NotificationSetting table.

				User's PR:
				${JSON.stringify({
					title: pr.title,
					body: pr.body,
					diff: diff,
				})}`
			const generator = createSimpleCompletion(prompt, userId)

			// Generate the summary using OpenAI
			let summary = ''

			let first = true
			while (true) {
				const newItem = await generator.next()
				if (newItem.done) {
					// cache the summary
					await setCache(pr.id.toString(), summary)
					return
				}
				summary += newItem.value

				if (first) {
					// yield the metadata right before the first stream of data
					yield getMetadataAction(pr)
					first = false
				}

				yield generateSummaryAction(newItem.value, pr.id)
			}
		}),
	)
}
