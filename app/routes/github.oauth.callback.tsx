import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { app, getMyUser } from '~/utils/github.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	// TODO: error handling
	const code = url.searchParams.get('code')
	if (!code) {
		return redirect('/github/install')
	}
	const {
		authentication: { token },
	} = await app.createToken({
		code,
	})

	const { data } = await getMyUser({ githubCookie: token })
	const baseParams = {
		name: data.name,
		avatarUrl: data.avatar_url,
		email: data.email,
		githubToken: token,
	}

	// create or update the user
	const user = await prisma.user.upsert({
		where: { githubUserId: data.id },
		update: baseParams,
		create: {
			githubUserId: data.id,
			...baseParams,
		},
	})

	const session = await getSession(request.headers.get('Cookie'))
	session.set('github-auth', token)
	session.set('user-id', user.id)
	return redirect('/app/summary', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}
