import { DataFunctionArgs, createCookie, redirect } from '@remix-run/node'
import { App } from 'octokit'
import { json } from 'stream/consumers'

import { Button } from '~/utils/forms.tsx'

const githubCookie = createCookie('github', {
	secrets: ['s3cret1'],
})

const app = new App({
	appId: process.env.GITHUB_APP_ID || '',
	privateKey: process.env.GITHUB_PRIVATE_KEY || '',
	oauth: {
		clientId: process.env.GITHUB_CLIENT_ID || '',
		clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
	},
})

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	const code = url.searchParams.get('code')
	if (!code) {
		return redirect('/install')
	}
	const {
		authentication: { token },
	} = await app.oauth.createToken({
		code,
	})
	return redirect('/', {
		headers: {
			'Set-Cookie': await githubCookie.serialize({ token }),
		},
	})
}