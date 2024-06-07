import { type DataFunctionArgs } from '@remix-run/node'

import { generateSummary, getUser, TimePeriod } from '#app/utils/github.ts'
import { getSession } from '#app/utils/session.server.ts'
import { eventStream } from '#app/utils/event-stream.ts'
import { getGithubToken } from '#app/orm/user.server'
import { Prisma } from '@prisma/client'
import { GITHUB_LOGIN_URL } from '#app/utils/constants'

function streamResponse(
	request: DataFunctionArgs['request'],
	response: Object,
) {
	return eventStream(request.signal, function setup(send, close) {
		send({
			event: 'githubData',
			data: JSON.stringify(response),
		})
		setTimeout(() => {
			close()
		}, 0)
		return () => { }
	})
}

function streamErrorResponse(
	request: DataFunctionArgs['request'],
	message: string,
) {
	return streamResponse(request, {
		action: 'error',
		message,
	})
}

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)

	const userName = url.searchParams.get('userName')
	if (typeof userName !== 'string' || !userName) {
		return streamErrorResponse(request, 'Invalid username')
	}

	const timePeriod = url.searchParams.get('timePeriod') || '1w'
	if (!Object.values(TimePeriod).includes(timePeriod as TimePeriod)) {
		return streamErrorResponse(request, 'Invalid time period')
	}
	const timePeriod2Use = timePeriod as TimePeriod

	const session = await getSession(request.headers.get('Cookie'))
	try {
		const gitHubApiToken = await getGithubToken(session.get('user-id'))
		// TODO: fix this
		const { name }: any = await getUser({ userName, githubCookie: gitHubApiToken })
		const name2Use = name || userName

		return eventStream(request.signal, function setup(send, close) {
			const sendMessage = (payload: object) => {
				send({
					event: 'githubData',
					data: JSON.stringify(payload),
				})
			}

			generateSummary({
				userName,
				name: name2Use,
				githubCookie: gitHubApiToken,
				timePeriod: timePeriod2Use,
				userId: session.get('user-id'),
			})
				.then(async generators => {
					if (generators.length === 0) {
						sendMessage({
							action: 'error',
							message: 'No PRs found',
						})
						close()
						return
					}
					let count = 0
					for await (const generator of generators) {
						while (true) {
							const newItem = await generator.next()
							if (newItem.done) {
								break
							}
							sendMessage({ index: count, ...newItem.value })
							count += 1
							// quit if we are done
							if (newItem.done) {
								break
							}
						}
					}

					// send empty data when we are done
					sendMessage({
						action: 'stop',
						index: count + 1,
					})
					close()
				})
				.catch(err => {
					sendMessage({
						action: 'error',
						message: err.message,
					})
					close()
				})

			return () => { }
		})
	} catch (error) {
		console.log('got error', { error })
		// check if user does not exist
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2025') {
				return streamResponse(request, {
					action: 'redirect',
					url: GITHUB_LOGIN_URL,
				})
			}
		}

		console.error(error)
		return streamErrorResponse(request, 'Unknown error')
	}
}
