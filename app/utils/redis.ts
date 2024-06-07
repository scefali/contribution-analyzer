import { Redis } from 'ioredis'

const DEFAULT_EXPIRATION = 60 * 60 * 24 * 7 // 7 days

const client = new Redis(process.env.REDIS_CONNECTION_STRING as string)
client.on('error', function (e) {
	console.log('Redis error: ' + e)
})

export const setCache = async (
	key: string,
	value: Parameters<typeof client.set>[1],
	expiration?: number,
) => {
	await client.set(key, value, 'EX', expiration || DEFAULT_EXPIRATION)
}

export const getCache = async (key: string) => {
	return await client.get(key)
}
