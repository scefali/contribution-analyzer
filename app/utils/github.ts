import { OAuthApp } from '@octokit/oauth-app'
import { Octokit } from 'octokit'
import type { Endpoints } from '@octokit/types'

import { generateSummaryForPrs } from './ai.ts'

type SearchIssuesResponseType = Endpoints['GET /search/issues']['response']
export type PullRequest = SearchIssuesResponseType['data']['items'][0]

export enum TimePeriod {
	OneWeek = '1w',
	OneMonth = '1m',
	ThreeMonths = '3m',
	OneYear = '1y',
}

export const app = new OAuthApp({
	clientType: 'github-app',
	clientId: process.env.GITHUB_CLIENT_ID || '',
	clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
})

export const getClient = (authToken: string) => {
	return new Octokit({
		auth: authToken,
	})
}

export const getPrsForSummary = async ({
	userName,
	githubCookie,
	timePeriod,
}: {
	userName: string
	githubCookie: string
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
		case TimePeriod.ThreeMonths:
			cutoffDate.setMonth(cutoffDate.getMonth() - 3)
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
	if (!output.items) {
		return []
	}
	// filter out PRs that are older than startDate
	const prs = output.items.filter(pr => {
		if (!pr.closed_at) {
			return false
		}
		const prDate = new Date(pr.closed_at)
		return prDate >= cutoffDate
	})
	return prs
}

function* yieldResult(result: string) {
  yield result;
}


export const generateSummary = async ({
	userId,
	userName,
	githubCookie,
	name,
	timePeriod,
	customPrompt,
}: {
	userName: string
	githubCookie: string
	name: string
	timePeriod: TimePeriod
	userId: number
	customPrompt?: string
}) => {
	const prs = await getPrsForSummary({ userName, githubCookie, timePeriod })

	console.group("considering", prs.length, "prs")
	// if there are no prs, then we can't generate a summary
	if (prs.length === 0) {
		// TODO: better time period rendering
		return yieldResult(`No PRs found for ${name} in the past ${timePeriod}`)
	}

	return generateSummaryForPrs({ prs, name, customPrompt, userId })
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

export const getMyUser = async ({ githubCookie }: { githubCookie: string }) => {
	const client = getClient(githubCookie)
	return client.rest.users.getAuthenticated()
}
