import React, { useState } from 'react'
import { App } from 'octokit'
import { json, type DataFunctionArgs } from '@remix-run/node'


import { ButtonLink } from '~/utils/forms.tsx'
import { useLoaderData } from '@remix-run/react'
import { json } from '@remix-run/node'

export function loader() {
	const redirectUri = 'https://scefali.ngrok.io/github/oauth/callback'
	const githubUrl = new URL('https://github.com/login/oauth/authorize')
  console.log("process", process.env)
	githubUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID || '')
	githubUrl.searchParams.set('redirect_uri', redirectUri)
	githubUrl.searchParams.set('scope', 'repo')
	return json({
		githubUrl: githubUrl.toString(),
	})
}

function GithubAppInstallationPage() {
	const { githubUrl } = useLoaderData()
	return (
		<div>
			<h1>Github Application Installation</h1>
			<ButtonLink size="md" variant="primary" to={githubUrl}>
				Install GitHub Application
			</ButtonLink>
		</div>
	)
}

export default GithubAppInstallationPage
