import { OAuthApp } from '@octokit/oauth-app'
import { Octokit } from 'octokit'
import type { Endpoints } from '@octokit/types'

import { generateSummaryForPrs } from './ai.ts'
import { r } from 'node_modules/msw/lib/glossary-de6278a9.js'

type SearchIssuesResponseType = Endpoints['GET /search/issues']['response']
export type PullRequest = SearchIssuesResponseType['data']['items'][0]

export const app = new OAuthApp({
	clientType: 'oauth-app',
	clientId: process.env.GITHUB_CLIENT_ID || '',
	clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
})

export const getClient = (authToken: string) => {
	return new Octokit({
		auth: authToken,
	})
}

export const generateSummary = async ({
	userName,
	githubCookie,
	name,
}: {
	userName: string
	githubCookie: string
	name: string
}) => {
	const query = `is:pull-request+is:merged+author:${userName}`
	// TODO: use Github client to fetch PRs
	const response = await fetch(
		`https://api.github.com/search/issues?q=${query}`,
		{
			headers: {
				Authorization: `token ${githubCookie}`,
			},
		},
	)

	// const response = await fetch(
	// 	`https://api.github.com/repos/getsentry/getsentry/pulls?q=${query}`,
	// 	{
	// 		headers: {
	// 			Authorization: `token ${githubCookie}`,
	// 		},
	// 	},
	// )]
	const output = (await response.json()) as SearchIssuesResponseType['data']
	return generateSummaryForPrs({ prs: output.items, name })
}

export const getUser = async ({
	userName,
	githubCookie,
}: {
	userName: string
	githubCookie: string
}) => {
	const client = getClient(githubCookie)
	return client.rest.users.getByUsername({ username: userName })
}
