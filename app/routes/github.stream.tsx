import { type DataFunctionArgs } from '@remix-run/node'

import { generateSummary, getUser, TimePeriod } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { eventStream } from '~/utils/event-stream.ts'
import { getGithubToken } from '~/orm/user.server'

const BUFFER_SIZE = 1

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
		return () => {}
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
		const {
			data: { name },
		} = await getUser({ userName, githubCookie: gitHubApiToken })
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
				.then(async generator => {
					let count = 0
					let buffer = []
					while (true) {
						const newItem = await generator.next()
						buffer.push(newItem.value)
						if (buffer.length >= BUFFER_SIZE || newItem.done) {
							sendMessage({
								value: buffer.join(''),
								action: 'data',
								index: count,
							})
							// quit if we are done
							if (newItem.done) {
								// send empty data when we are done
								sendMessage({
									action: 'stop',
									index: count + 1,
								})
								close()
								return
							}
							// otherwise empty the buffer
							count += 1
							buffer = []
						}
					}
				})
				.catch(err => {
					console.log('got error', err)
					sendMessage({
						action: 'error',
						message: err.message,
					})
					close()
				})
			return () => {}
		})
	} catch (error) {
		console.error(error)
		return streamErrorResponse(request, 'Unknown error')
	}
}
