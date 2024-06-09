import { generateSummaryForPrs } from './ai.ts'

// TODO: fix this
type SearchIssuesResponseType = any
export type PullRequest = SearchIssuesResponseType['data']['items'][0]

export enum TimePeriod {
	OneWeek = '1w',
	OneMonth = '1m',
	ThreeMonths = '3m',
	OneYear = '1y',
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

	const query = `is:pull-request+is:merged+author:${userName}+closed:>${cutoffDate.toISOString()}`
	// TODO: use Github client to fetch PRs
	// Implementing pagination and iterating through each page until there are no more pages
	let prs: SearchIssuesResponseType['data']['items'] = []
	let page = 1
	let hasMorePages = true
	while (hasMorePages) {
		const response = await fetch(
			`https://api.github.com/search/issues?q=${query}&per_page=100&page=${page}`,
			{
				headers: {
					Authorization: `token ${githubCookie}`,
				},
			},
		)
		const output = (await response.json()) as SearchIssuesResponseType['data']
		if (!output.items.length) {
			hasMorePages = false
		} else {
			prs = prs.concat(...output.items)
			page++
		}
	}
	if (!prs.length) {
		return []
	}
	return prs.sort((a: { closed_at?: string }, b: { closed_at?: string }) => {
		const aDate = new Date(a.closed_at ?? '')
		const bDate = new Date(b.closed_at ?? '')
		return bDate.getTime() - aDate.getTime()
	})
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
	return generateSummaryForPrs({
		prs,
		name,
		customPrompt,
		githubCookie,
		userId,
	})
}

export const getUser = async ({
	userName,
	githubCookie,
}: {
	userName: string
	githubCookie: string
}) => {
	const response = await fetch(`https://api.github.com/users/${userName}`, {
		headers: {
			Authorization: `token ${githubCookie}`,
		},
	})
	return await response.json()
}

export const getMyUser = async ({ githubCookie }: { githubCookie: string }) => {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `token ${githubCookie}`,
		},
	})
	const out = await response.json()
	return out
}

export const getCommentsforPr = async ({
	githubCookie,
	repo,
	owner,
	prNumber,
}: {
	githubCookie: string
	repo: string
	owner: string
	prNumber: number
}) => {
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
		{
			headers: {
				Authorization: `token ${githubCookie}`,
			},
		},
	)
	return response.json()
}
