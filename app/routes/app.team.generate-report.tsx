import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'

import { sendEmail } from '~/utils/email.server.ts'
import {
	TimePeriod,
	generateSummary,
	getPrsForSummary,
} from '~/utils/github.ts'

import TeamSummary from '~/components/emails/team-summary.tsx'
import { getSession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'

interface ActionData {
	status: 'error' | 'success'
	message?: string
}

export async function action({
	request,
}: DataFunctionArgs): Promise<TypedResponse<ActionData>> {
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')
	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: userId,
		},
	})
	const summaryList = await Promise.all(
		teamMembers.map(async member => {
			const iterator = await generateSummary({
				name: member.name || 'Unknown',
				githubCookie: session.get('github-auth'),
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
	console.log(summaryList)

	const { status, error } = await sendEmail({
		react: <TeamSummary summaryList={summaryList} teamMembers={teamMembers} />,
		to: 'scefali@sentry.io',
		subject: 'subject',
	})

	if (status !== 'success') {
		return json({ status: 'error', message: error.message }, { status: 400 })
	}
	return json({ status: 'success' })
}
