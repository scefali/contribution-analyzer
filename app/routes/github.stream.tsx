import { type DataFunctionArgs, json } from '@remix-run/node'
import { eventStream } from 'remix-utils'

import { generateSummary, getUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { TimePeriod } from '~/utils/github.ts'

const BUFFER_SIZE = 1

function streamResponse(
	request: DataFunctionArgs['request'],
	response: Object,
) {
	return eventStream(request.signal, function setup(send) {
		send({
			event: 'githubData',
			data: JSON.stringify(response),
		})
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
	const githubCookie = session.get('github-auth')

	const {
		data: { name },
	} = await getUser({ userName, githubCookie })
	const name2Use = name || userName

	return eventStream(request.signal, function setup(send) {
		let quit = false
		generateSummary({
			userName,
			name: name2Use,
			githubCookie,
			timePeriod: timePeriod2Use,
			userId: session.get('user-id'),
		})
			.then(async generator => {
				let count = 0
				let buffer = []
				while (!quit) {
					const newItem = await generator.next()
					buffer.push(newItem.value)
					if (buffer.length >= BUFFER_SIZE || newItem.done) {
						console.log('sending buffer', buffer.join(''))
						send({
							event: 'githubData',
							data: JSON.stringify({
								value: buffer.join(''),
								action: 'data',
								index: count,
							}),
						})
						// quit if we are done
						if (newItem.done) {
							send({
								event: 'githubData',
								data: JSON.stringify({
									action: 'stop',
								}),
							})
							console.log('done')
							return
						}
						// otherwise empty the buffer
						count += 1
						buffer = []
					}
				}
				console.log('post quit')
			})
			.catch(err => {
				console.log('got error', err)
				send({
					event: 'githubData',
					data: JSON.stringify({
						action: 'error',
						message: err.message,
					}),
				})
			})
		return () => {
			quit = true
		}
	})
}
