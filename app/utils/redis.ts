import { Redis } from 'ioredis'

const client = new Redis(process.env.REDIS_CONNECTION_STRING as string)
client.on('error', function (e) {
	console.log('Redis error: ' + e)
})

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
