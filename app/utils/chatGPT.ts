/// `ChatGPT.tsx` from https://github.com/openai/openai-node/issues/18
import { type CreateCompletionResponse, Configuration, OpenAIApi } from 'openai'
import { type IncomingMessage } from 'http'

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
})
const OpenAI = new OpenAIApi(configuration)

async function* chunksToLines(
	chunksAsync: IncomingMessage,
): AsyncGenerator<string> {
	let previous = ''

	for await (const chunk of chunksAsync) {
		const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)

		previous += bufferChunk

		let eolIndex

		while ((eolIndex = previous.indexOf('\n')) >= 0) {
			// line includes the EOL
			const line = previous.slice(0, eolIndex + 1).trimEnd()

			if (line === 'data: [DONE]') break

			if (line.startsWith('data: ')) yield line

			previous = previous.slice(eolIndex + 1)
		}
	}
}

async function* linesToMessages(
	linesAsync: AsyncGenerator<string>,
): AsyncGenerator<string> {
	for await (const line of linesAsync) {
		const message = line.substring('data :'.length)

		yield message
	}
}

async function* streamCompletion(
	data: IncomingMessage,
): AsyncGenerator<string> {
	yield* linesToMessages(chunksToLines(data))
}

export async function* createSimpleCompletion(prompt: string) {
	const completion = await OpenAI.createCompletion(
		{
			model: 'text-davinci-003',
			prompt,
			max_tokens: 1000,
			stream: true,
		},
		{
			responseType: 'stream',
		},
	)

	for await (const message of streamCompletion(
		completion.data as unknown as IncomingMessage,
	))
		try {
			// convert to the openai response type

			const parsed = JSON.parse(message) as CreateCompletionResponse

			const { text } = parsed.choices[0]
			if (typeof text === 'string') {
				yield text
			}
		} catch (error) {
			console.error('Could not JSON parse stream message', message, error)
		}
}
