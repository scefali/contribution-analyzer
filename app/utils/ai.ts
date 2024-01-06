import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'

const MAX_TOKENS = 16000

export async function* generateSummaryForPrs({
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
	// Add the title, body, and link of each PR to the text buffer
	const maxPrContentLength = Math.floor(MAX_TOKENS / prs.length)
	const textBuffer = await Promise.all(
		prs.map(async pr => {
			let prContent = `Title: ${pr.title} Body: ${pr.body} Link: ${pr.html_url}`
			if (pr?.pull_request?.diff_url) {
				const response = await fetch(pr.pull_request.diff_url)
				const diffText = await response.text()
				prContent += `Diff: ${diffText}`
			}
			if (prContent.length > maxPrContentLength) {
				return prContent.substring(0, maxPrContentLength)
			} else {
				return prContent
			}
		}),
	)

	// Construct the prompt for OpenAI
	const prompt = `
    Below is a list of titles and bodies of PRs which ${name} has done in the past week.
    Create a summary below in the form of a list nothing outside the list.
    Each item should be a 2-3 sentence summary of the PR and include a link to the PR at the start
		in markdown format. Explain what functionality is changing as well. Each item should be separated by a new line.

    ${customPrompt || ''}: 

		Example:
		[Link](https://github.com/getsentry/sentry/pull/54735) Adds two notification tables (NotificationSettingOption and NotificationSettingProvider). These tables are the output of splitting the exisitng NotificationSetting table.

		Users's PRs:
    ${textBuffer.join('\n')}`

	console.log('prompt', prompt)

	// Generate the summary using OpenAI
	const generator = createSimpleCompletion(prompt, userId)
	while (true) {
		const newItem = await generator.next()
		if (newItem.done) {
			return
		}
		yield newItem.value
	}
}
