/// `ChatGPT.tsx` from https://github.com/openai/openai-node/issues/18
import { type CreateCompletionResponse, Configuration, OpenAIApi } from 'openai'
import { type IncomingMessage } from 'http'
import { setCache, getCache } from '~/utils/redis.ts'
import { LLMRateLimitError } from './errors'

const DAILY_RATE_LIMIT = 2

interface RateLimitCount {
	timestamp: number
	count: number
}

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

export async function* createSimpleCompletionNoCache(prompt: string) {
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

	try {
		// convert to the openai response type

		for await (const message of streamCompletion(
			completion.data as unknown as IncomingMessage,
		)) {
			const parsed = JSON.parse(message) as CreateCompletionResponse
			const { text } = parsed.choices[0]
			if (typeof text === 'string') {
				yield text
			}
		}
	} catch (error) {
		console.error('Could not stream completion', error)
	}
}

export async function* createSimpleCompletion(prompt: string, userId: number) {
	// If the result is cached, we don't have to rate limit
	const cached = await getCache(prompt)
	if (cached) {
		console.log('cached')
		yield cached
		return
	}

	// Increment and check rate limit
	const currentTimestamp = Date.now()
	const startOfDay = new Date().setHours(0, 0, 0, 0)
	const rateLimitKey = `llm_user_rate_limit:${userId}`

	const rateLimitCountJson = await getCache(rateLimitKey)
	console.log('rateLimitCountJson', rateLimitCountJson, rateLimitKey)

	// parse the rate limit count from cache
	let rateLimitCount: RateLimitCount = { timestamp: 0, count: 0 }
	try {
		rateLimitCount = rateLimitCountJson
			? (JSON.parse(rateLimitCountJson) as RateLimitCount)
			: { timestamp: 0, count: 0 }
	} catch (err) {
		if (err instanceof SyntaxError) {
			rateLimitCount = { timestamp: 0, count: 0 }
		}
	}

	// Check if rate limit exceeded
	if (rateLimitCount.count > DAILY_RATE_LIMIT) {
		console.log('Rate limit exceeded for user:', userId)
		throw new LLMRateLimitError('Rate limit exceeded')
	}

	// now that we have the rate limit count, we can generate the prompt
	const result = createSimpleCompletionNoCache(prompt)
	const output = []
	for await (const message of result) {
		output.push(message)
		yield message
	}

	await setCache(prompt, output.join(''))

	// Update rate limit count
	console.log('teimestamp', rateLimitCount.timestamp)
	if (rateLimitCount.timestamp < startOfDay) {
		// Reset count for a new day
		console.log(
			'new count at timestamp',
			currentTimestamp,
			JSON.stringify({ timestamp: currentTimestamp, count: 1 }),
		)
		await setCache(
			rateLimitKey,
			JSON.stringify({ timestamp: currentTimestamp, count: 1 }),
		)
	} else {
		// Increment count for the day
		const count = rateLimitCount.count + 1
		console.log('count', count)
		await setCache(
			rateLimitKey,
			JSON.stringify({ timestamp: currentTimestamp, count }),
		)
	}
}
