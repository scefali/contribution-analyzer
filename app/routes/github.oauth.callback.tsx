import { type DataFunctionArgs, redirect } from '@remix-run/node'
import sqlite3 from 'sqlite3'
import { GITHUB_LOGIN_URL } from '#app/utils/constants'
import { prisma } from '#app/utils/db.server.ts'
import { getMyUser } from '#app/utils/github.ts'
import { commitSession, getSession } from '#app/utils/session.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	// TODO: error handling
	const code = url.searchParams.get('code')
	if (!code) {
		return redirect(GITHUB_LOGIN_URL)
	}

	// TODO: better typing
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tokenResponse: any = await fetch(
		`https://github.com/login/oauth/access_token`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: code,
			}),
		},
	).then(res => res.json())
	const {
		access_token: token,
		refresh_token: refreshToken,
		expires_in: expiresIn,
	} = tokenResponse
	const data: any = await getMyUser({ githubCookie: token })

	console.log('Database URL:', process.env.DATABASE_URL)

	const dbPath = process.env.DATABASE_URL.split(':')[1].split('?')[0]
	console.log('Database Path:', dbPath)

	// Use sqlite3 to list all tables in the database
	const db = new sqlite3.Database(dbPath)
	db.serialize(() => {
		db.all(
			"SELECT name FROM sqlite_master WHERE type='table';",
			(err, tables) => {
				if (err) {
					console.error('Error fetching tables:', err)
				} else {
					console.log('Tables:', tables)
				}
			},
		)
	})

	const gitHubUserId = data.id

	const baseGitHubParams = {
		githubToken: token,
		githubRefreshToken: refreshToken,
		githubTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
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
