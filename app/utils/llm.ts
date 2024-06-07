/// `ChatGPT.tsx` from https://github.com/openai/openai-node/issues/18
import OpenAI from 'openai'
import { setCache, getCache } from '#app/utils/redis.ts'
import { LLMRateLimitError } from './errors'

const DAILY_RATE_LIMIT = Number(process.env.DAILY_RATE_LIMIT ?? 200)

interface RateLimitCount {
	timestamp: number
	count: number
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function* createSimpleCompletionNoCache(prompt: string) {
	const stream = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo-16k',
		messages: [{ role: 'user', content: prompt }],
		stream: true,
	})
	for await (const part of stream) {
		const delta = part.choices[0]?.delta?.content || ''
		yield delta
	}
}

/**
 * Creates a stream of messages from our LLM service
 * Handles rate limiting but does not handle caching since
 * that is done in generateSummaryForPrs
 */
export async function* createSimpleCompletion(prompt: string, userId: number) {
	// Increment and check rate limit
	const currentTimestamp = Date.now()
	const startOfDay = new Date().setHours(0, 0, 0, 0)
	const rateLimitKey = `llm_user_rate_limit:${userId}`

	const rateLimitCountJson = await getCache(rateLimitKey)

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
	for await (const message of result) {
		yield message
	}

	try {
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
			await setCache(
				rateLimitKey,
				JSON.stringify({ timestamp: currentTimestamp, count }),
			)
		}
	} catch (err) {
		console.error('Could not set cache', err)
	}
}
