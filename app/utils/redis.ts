import { Redis } from 'ioredis'

const client = new Redis(process.env.UPSTASH_REDIS_CONNECTION_STRING as string)

export const setCache = async (
	key: string,
	value: any,
	expiration?: number,
) => {
	await client.set(key, value, 'EX', expiration || 60 * 60 * 24)
}

export const getCache = async (key: string) => {
	return await client.get(key)
}
