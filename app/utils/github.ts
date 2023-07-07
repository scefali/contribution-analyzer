import { OAuthApp } from '@octokit/oauth-app'
import { Octokit } from 'octokit'
import type { Endpoints } from '@octokit/types'

import { generateSummaryForPrs } from './ai.ts'

type SearchIssuesResponseType = Endpoints['GET /search/issues']['response']
export type PullRequest = SearchIssuesResponseType['data']['items'][0]

export enum TimePeriod {
	OneWeek = '1w',
	OneMonth = '1m',
	OneYear = '1y',
}

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
	timePeriod,
}: {
	userName: string
	githubCookie: string
	name: string
	timePeriod: TimePeriod
}) => {
	const cutoffDate = new Date()
	switch (timePeriod) {
		case TimePeriod.OneWeek:
			cutoffDate.setDate(cutoffDate.getDate() - 7)
			break
		case TimePeriod.OneMonth:
			cutoffDate.setMonth(cutoffDate.getMonth() - 1)
			break
		case TimePeriod.OneYear:
			cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
			break
		default:
			throw new Error('Invalid time period')
	}

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
	const output = (await response.json()) as SearchIssuesResponseType['data']
	// filter out PRs that are older than startDate
	const prs = output.items.filter(pr => {
		if (!pr.closed_at) {
			return false
		}
		const prDate = new Date(pr.closed_at)
		return prDate >= cutoffDate
	})
	console.group("considering these pr's", prs.length)

	return generateSummaryForPrs({ prs, name })
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
