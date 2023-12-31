import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
} from '@remix-run/node'

import { sendEmail } from '~/utils/email.server.ts'
import { TimePeriod, generateSummary } from '~/utils/github.ts'

import TeamSummary from '~/components/emails/team-summary.tsx'
import { getSession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { LLMRateLimitError } from '~/utils/errors'
import { getGithubToken } from '~/orm/user.server'

interface ActionData {
	status: 'error' | 'success'
	message?: string
}

export async function action({
	request,
}: DataFunctionArgs): Promise<TypedResponse<ActionData>> {
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	})
	if (!user) {
		return json(
			{
				status: 'error',
				message: `User not found`,
			},

			{ status: 400 },
		)
	}
	if (!user.email) {
		return json(
			{
				status: 'error',
				message: `Please add an email to your profile`,
			},

			{ status: 400 },
		)
	}

	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: userId,
		},
	})
	const gitHubApiToken = await getGithubToken(userId)
	try {
		const summaryList = await Promise.all(
			teamMembers.map(async member => {
				const iterator = await generateSummary({
					userId,
					name: member.name || 'Unknown',
					githubCookie: gitHubApiToken,
					userName: member.gitHubUserName,
					timePeriod: TimePeriod.OneWeek,
				})
				const output = []
				for await (const value of iterator) {
					output.push(value)
				}
				return output.join('')
			}),
		)

		const { status, error } = await sendEmail({
			react: (
				<TeamSummary summaryList={summaryList} teamMembers={teamMembers} />
			),
			to: user.email,
			subject: 'Github Contribution Report for Team',
		})
		if (status !== 'success') {
			return json({ status: 'error', message: error.message }, { status: 400 })
		}
		return json({ status: 'success' })
	} catch (error) {
		if (error instanceof LLMRateLimitError) {
			return json(
				{
					status: 'error',
					message: `LLM limit exceeded. Please try again later.`,
				},

				{ status: 429 },
			)
		}
		return json({ status: 'error', message: 'Unknown error' }, { status: 500 })
	}
}
