import { useLoaderData, Link} from '@remix-run/react'
import { json, type DataFunctionArgs, redirect } from '@remix-run/node'
import { Prisma } from '@prisma/client'

import Github from '~/images/github.tsx'

import { getSession } from '~/utils/session.server.ts'
import { getGithubToken } from '~/orm/user.server'

export async function loader({ request }: DataFunctionArgs) {
	const urlObj = new URL(request.url)
	console.log(urlObj)
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')
	if (userId) {
		try {
			await getGithubToken(session.get('user-id'))
			// redirect to the app page
			return redirect('/app/summary')
		} catch (error: unknown) {
			console.log('got error', { error })
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025" ) {
					console.log('user not found')
					session.unset('user-id')
					session.unset('access-token')
					session.unset('refresh-token')
				}
			}
		}
	}

	const redirectUri = `https://${urlObj.host}/github/oauth/callback`
	console.log({ redirectUri })
	const githubUrl = new URL('https://github.com/login/oauth/authorize')
	// TODO: use oktokit to generate this url
	githubUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID || '')
	githubUrl.searchParams.set('redirect_uri', redirectUri)
	githubUrl.searchParams.set('scope', 'repo,issues')
	return json({
		githubUrl: githubUrl.toString(),
	})
}

function GithubAppInstallationPage() {
	const { githubUrl } = useLoaderData()
	return (
		<div className="flex pt-14">
			<div className="m-auto max-w-screen-sm p-4">
				<div className="rounded-sm border-solid bg-secondary p-4 shadow-sm">
					<h1 className="text-xl font-bold">Connect your Github Account</h1>
					<p className="text-sm mt-2 text-muted-foreground">
						Connect your Github to get started with the Contribution Analyzer
					</p>
					<Link to={githubUrl} className="mt-4 flex">
						<Github className="my-auto mr-1" />
						Install
					</Link>
				</div>
			</div>
		</div>
	)
}

export default GithubAppInstallationPage
