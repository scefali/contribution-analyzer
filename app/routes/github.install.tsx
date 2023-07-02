import React, { useState } from 'react'
import { App } from 'octokit'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'

import Github from '~/images/github.tsx'

import { useLoaderData } from '@remix-run/react'

export function loader() {
	const redirectUri = 'https://scefali.ngrok.io/github/oauth/callback'
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
			<div className="m-auto max-w-screen-sm">
				<div className="rounded-sm p-36 shadow-sm bg-secondary border-solid">
					<h1 className="text-xl font-bold">Connect your Github Account</h1>
					<p className="text-sm text-muted-foreground mt-2">
						Connect your Github to get started with the Contribution Analyzer
					</p>
					<Link to={githubUrl} className="flex mt-4">
						<Github className="my-auto mr-1" />
						Install
					</Link>
				</div>
			</div>
		</div>
	)
}

export default GithubAppInstallationPage
