import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { app } from '~/utils/github.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	const code = url.searchParams.get('code')
	if (!code) {
		return redirect('/install')
	}
	const {
		authentication: { token },
	} = await app.createToken({
		code,
	})

	const session = await getSession(request.headers.get('Cookie'))
	session.set('github-auth', token)
	return redirect('/app', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}
