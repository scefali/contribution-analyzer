/// `ChatGPT.tsx` from https://github.com/openai/openai-node/issues/18
import OpenAI from 'openai'
import { type IncomingMessage } from 'http'
import { setCache, getCache } from '~/utils/redis.ts'
import { LLMRateLimitError } from './errors'

const DAILY_RATE_LIMIT = Number(process.env.DAILY_RATE_LIMIT ?? 20)

interface RateLimitCount {
	timestamp: number
	count: number
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

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

export async function* createSimpleCompletionNoCache(prompt: string) {
	const stream = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [{ role: 'user', content: prompt }],
		stream: true,
	})
	for await (const part of stream) {
		const delta = part.choices[0]?.delta?.content || ''
		yield delta
	}
}

export async function* createSimpleCompletion(prompt: string, userId: number) {
	// If the result is cached, we don't have to rate limit
	let useCache: boolean = false
	try {
		const cached = await getCache(prompt)
		useCache = true
		if (cached) {
			yield cached
			return
		}
	} catch (err) {
		console.error('Could not get cache', err)
		useCache = false
	}

	// Increment and check rate limit
	const currentTimestamp = Date.now()
	const startOfDay = new Date().setHours(0, 0, 0, 0)
	const rateLimitKey = `llm_user_rate_limit:${userId}`

	// if cache doesn't work, just let it through
	const rateLimitCountJson = useCache
		? await getCache(rateLimitKey)
		: JSON.stringify({ timestamp: 0, count: 0 })
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

	try {
		await setCache(prompt, output.join(''))

		// Update rate limit count
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
	} catch (err) {
		console.error('Could not set cache', err)
	}
}
