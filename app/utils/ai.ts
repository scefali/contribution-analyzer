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

  // Add the title, body, and link of each PR to the text buffer
  for (const pr of prs) {
    textBuffer.push(`Title: ${pr.title}`)
    textBuffer.push(`Body: ${pr.body}`)
    textBuffer.push(`Link: ${pr.html_url}`)
  }

  // Construct the prompt for OpenAI
  const prompt = `
    Below is a list of titles and bodies of PRs which ${name} has done in the past week.
    Create a summary below in the form of a list nothing outside the list.
    Each items should say what the PR does with a link at the end
    ${customPrompt || ''}: 
    ${textBuffer.join('\n')}`

  console.log({textBuffer})

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
