import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'

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
	const textBuffer = await Promise.all(
		prs.map(async pr => {
			let text = ''
			text += `Title: ${pr.title}`
			text += `Body: ${pr.body}`
			text += `Link: ${pr.html_url}`
			// TODO: Figure out better way of including the diff
			if (pr?.pull_request?.diff_url) {
				const response = await fetch(pr.pull_request.diff_url)
				const diffText = await response.text()
				text += `Diff: ${diffText}`
			}
			return text
		}),
	)

	// Construct the prompt for OpenAI
	const prompt = `
    Below is a list of titles and bodies of PRs which ${name} has done in the past week.
    Create a summary below in the form of a list nothing outside the list.
    Each item. should say what the PR does with a link at the end in the markdown format.
		Each item should be a single line.
    ${customPrompt || ''}: 
    ${textBuffer.join('\n')}`


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
