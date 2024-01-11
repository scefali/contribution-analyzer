import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'

const MAX_DIFF_LENGTH = 1000

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
	const prDataArray = await Promise.all(
		prs.map(async pr => {
			// Add metadata related to the PR
			const prContent = {
				title: pr.title,
				body: pr.body,
				link: pr.html_url,
				id: pr.id,
				diffUrl: pr?.pull_request?.diff_url,
				closedAt: pr.closed_at as string, // we've already filtered out PRs that are open
			}
			return prContent
		}),
	)

	return Promise.all(
		prDataArray.map(async function* (pr) {
			// load the diff if it's avaialable on-demand
			let diff = ''
			if (pr.diffUrl) {
				const response = await fetch(pr.diffUrl)
				const diffText = await response.text()
				diff = diffText.substring(0, MAX_DIFF_LENGTH)
			}

			// TODO: add comment data

			const prMetadata = {
				action: 'metadata',
				data: {
					title: pr.title,
					link: pr.link,
					id: pr.id,
					closedAt: pr.closedAt,
				},
			} as const
			yield prMetadata
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
			while (true) {
				const newItem = await generator.next()
				console.log('newItem', newItem)
				if (newItem.done) {
					return
				}
				const message = {
					action: 'summary',
					data: { text: newItem.value, id: pr.id },
				} as const
				yield message
			}
		}),
	)
}
