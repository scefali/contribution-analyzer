import { createSimpleCompletion } from './chatGPT.ts'
import type { PullRequest } from './github.ts'

export const generateSummaryForPrs = async ({
	name,
	prs,
}: {
	prs: PullRequest[]
	name: string
}) => {
	let textBuffer = []
	const output = []
	// for each pr, add the title and body to the text buffer as a prompt
	// then feed in the prompt into openai api asking it to summarize
	// the users contributions
	while (prs.length > 0) {
		const pr = prs.pop()
		console.log({})
		if (pr) {
			textBuffer.push(`Title: ${pr.title}`)
			textBuffer.push(`Body: ${pr.body}`)
		}
		// if joined text buffer is > 1000 characters, then summarize
		// and clear the buffer
		const possiblePrompt = `Summarize this users Github activity for ${name} who is an employee of Sentry. Please be sure to list all the major projects and featuers this peron worked on: ${textBuffer.join(
			'',
		)}`
		if (possiblePrompt.length > 3000) {
			textBuffer = []
			// pass the prompt to openai api stream
			const newItem = await createSimpleCompletion(possiblePrompt)
			console.log({ newItem })
			output.push(newItem)
		}
	}
	console.log(output)
	return output.join('\n')
}
