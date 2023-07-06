import { type DataFunctionArgs, json } from '@remix-run/node'
import { eventStream } from 'remix-utils'

import { generateSummary, getUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const url = new URL(request.url)
	const userName = url.searchParams.get('userName')
	if (typeof userName !== 'string' || !userName) {
		return json(
			{ status: 'error', message: 'Invalid username' },
			{ status: 400 },
		)
	}

	const session = await getSession(request.headers.get('Cookie'))
	const githubCookie = session.get('github-auth')

	const {
		data: { name },
	} = await getUser({ userName, githubCookie })
	const name2Use = name || userName

	return eventStream(request.signal, function setup(send) {
		generateSummary({
			userName,
			name: name2Use,
			githubCookie,
		}).then(async generator => {
			while (true) {
				const newItem = await generator.next()
				if (newItem.done) {
					return
				}
				send({ event: 'data', data: newItem.value })
			}
		})
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		return () => {}
	})
}
