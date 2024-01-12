import { useLoaderData, Link } from '@remix-run/react'
import { json, type DataFunctionArgs, redirect } from '@remix-run/node'
import { Prisma } from '@prisma/client'
import Github from '~/images/github.tsx'
import { getSession } from '~/utils/session.server.ts'
import { getGithubToken } from '~/orm/user.server'

// Existing loader function...

export async function loader({ request }: DataFunctionArgs) {
	const urlObj = new URL(request.url)
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')
	if (userId) {
		try {
			await getGithubToken(userId)
			// redirect to the app page
			return redirect('/app/summary')
		} catch (error: unknown) {
			console.log('got error', { error })
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
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
  const { githubUrl } = useLoaderData();

  return (
    <div className="flex min-h-screen flex-col justify-start bg-background text-foreground pt-4">
      <div className="w-full mx-auto max-w-md px-4">
        <div className="rounded-lg p-6 shadow-xl bg-card text-card-foreground mt-4">
          <h1 className="text-4xl mb-4 font-bold">
            GitHub Contribution Analyzer
          </h1>
          <p className="mb-6">
            A tool for engineers and their managers to analyze GitHub contributions.
          </p>
          <h2 className="text-2xl mb-3 font-semibold">Features</h2>
          <ul className="mb-6 list-inside list-disc">
            <li>
              View a summary of GitHub PR contributions for any user.
            </li>
            <li>Build your engineering team and monitor their progress.</li>
            <li>
              Receive weekly emails summarizing contributions made in the past
              week.
            </li>
          </ul>
          <Link
            to={githubUrl}
            className="inline-flex items-center justify-center rounded px-4 py-2 font-bold transition-colors duration-300 bg-primary text-black hover:bg-primary-dark"
          >
            <Github className="mr-2 h-6 w-6" />
            Connect your GitHub Account
          </Link>
        </div>
        <p className="text-sm mt-6 text-center text-muted-foreground">
          © 2023 Contribution Analyzer. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default GithubAppInstallationPage;
