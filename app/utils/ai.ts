import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'

export async function* generateSummaryForPrs({
	name,
	prs,
}: {
	prs: PullRequest[]
	name: string
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
		}
		// if joined text buffer is > 1000 characters, then summarize
		// and clear the buffer
		const possiblePrompt = `
		Below is a list of titles and bodies of a PR which ${name} has done in the past week. Create a summary below in the form of a single list: ${textBuffer.join('')}`
		if (possiblePrompt.length > 3000 || prs.length === 0) {
			textBuffer = []
			const generator = createSimpleCompletion(possiblePrompt)
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
