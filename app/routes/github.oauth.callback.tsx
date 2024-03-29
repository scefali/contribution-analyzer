import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { app, getMyUser } from '~/utils/github.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { GITHUB_LOGIN_URL } from '~/utils/constants'

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	// TODO: error handling
	const code = url.searchParams.get('code')
	if (!code) {
		return redirect(GITHUB_LOGIN_URL)
	}

	// TODO: better typing
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tokenResponse: any = await app.createToken({
		code,
	})
	const {
		authentication: { token, refreshToken, expiresAt },
	} = tokenResponse

	const { data } = await getMyUser({ githubCookie: token })

	const gitHubUserId = data.id

	const baseGitHubParams = {
		githubToken: token,
		githubRefreshToken: refreshToken,
		githubTokenExpiresAt: expiresAt,
	}
	const baseUserParams = {
		name: data.name,
		avatarUrl: data.avatar_url,
		email: data.email,
		gitHubUserId,
	}
	const user = await prisma.user.upsert({
		where: { gitHubUserId: gitHubUserId },
		update: baseUserParams,
		create: baseUserParams,
	})

	console.log('upsert')
	await prisma.gitHubAuth.upsert({
		where: { userId: user.id },
		update: baseGitHubParams,
		create: {
			...baseGitHubParams,
			userId: user.id,
		},
	})

	const session = await getSession(request.headers.get('Cookie'))
	session.set('github-auth', token)
	session.set('user-id', user.id)
	return redirect('/app/summary', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}
