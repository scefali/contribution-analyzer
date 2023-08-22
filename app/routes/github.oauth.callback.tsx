import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { app } from '~/utils/github.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { getMyUser } from '~/utils/github.ts'

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

	try {
		const tables = await prisma.$executeRaw`SELECT name FROM sqlite_master WHERE type='table';`;
		console.log("Tables in the database:", tables);
} catch (error) {
		console.error("Error fetching tables:", error);
}

	const { data } = await getMyUser({ githubCookie: token })
	const baseParams = {
		name: data.name,
		avatarUrl: data.avatar_url,
		email: data.email,
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
