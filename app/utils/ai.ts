import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'
import { getCache, setCache } from './redis.ts'

const MAX_DIFF_LENGTH = 1000

function getMetadataAction(pr: ReturnType<typeof getPrContentData>) {
	return {
		action: 'metadata',
		data: {
			title: pr.title,
			link: pr.link,
			id: pr.id,
			closedAt: pr.closedAt,
		},
	} as const
}

function generateSummaryAction(summary: string, id: number) {
	return {
		action: 'summary',
		data: { text: summary, id },
	} as const
}

function getPrContentData(pr: PullRequest) {
	return {
		title: pr.title,
		body: pr.body,
		link: pr.html_url,
		id: pr.id,
		diffUrl: pr?.pull_request?.diff_url,
		closedAt: pr.closed_at as string, // we've already filtered out PRs that are open
	}
}

export async function generateSummaryForPrs({
	name,
	prs,
	customPrompt,
	userId,
}: {
	prs: PullRequest[]
	name: string
	customPrompt?: string
	userId: number
}) {
	let prDataArray = await Promise.all(prs.map(getPrContentData))

	// load all summaries in the cache in parallel
	let prsToFetch = await Promise.all(
		prDataArray.map(async pr => {
			const cached = await getCache(pr.id.toString())
			if (cached) {
				return { summary: cached, ...pr }
			}
			return { summary: '', ...pr }
		}),
	)

	const prsWithCachedSummaries = []
	// iterate through the cached responses that exist and yield them
	for (const cached of prsToFetch) {
		// we only want to immediately pre-populate consecutive summaries from the beginning
		// if we don't, then flickers will happen
		if (!cached.summary) {
			break
		}
		if (cached.summary) {
			// remove the item so we don't yield it again
			prsWithCachedSummaries.push(cached)
			prsToFetch = prsToFetch.filter(prItem => prItem.id !== cached.id)
		}
	}

	// first do all the cached summaries, then the uncached ones
	return Promise.all(
		prsWithCachedSummaries
			.map(async function* (pr) {
				// yield the metadata then the summary
				yield getMetadataAction(pr)
				yield generateSummaryAction(pr.summary, pr.id)
			})
			.concat(
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

					// TODO: add comment data

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
			),
	)
}
