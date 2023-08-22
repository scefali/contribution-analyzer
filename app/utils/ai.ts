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
	let textBuffer = []
	// const output = []
	// for each pr, add the title and body to the text buffer as a prompt
	// then feed in the prompt into openai api asking it to summarize
	// the users contributions
	while (true) {
		const pr = prs.pop()
		if (pr) {
			textBuffer.push(`Title: ${pr.title}`)
			textBuffer.push(`Body: ${pr.body}`)
			textBuffer.push(`Link: ${pr.html_url}`)
		}
		// if joined text buffer is > 1000 characters, then summarize
		// and clear the buffer
		const possiblePrompt = `
		Below is a list of titles and bodies of a PR which ${name} has done in the past week.
		 Create a summary below in the form of a list using - with nothing outside the list. Do not say summary at the top. ${customPrompt}: 
		 ${textBuffer.join('')}`
		if (possiblePrompt.length > 5000 || prs.length === 0) {
			textBuffer = []
			const generator = createSimpleCompletion(possiblePrompt, userId)
			while (true) {
				const newItem = await generator.next()
				if (newItem.done) {
					// if we have no more prs to summarize, then we are done
					// otherwise, we need to continue to summarize the remaining prs
					if (prs.length === 0) {
						return
					} else {
						break
					}
				}
				yield newItem.value
			}
		}
	}
}
