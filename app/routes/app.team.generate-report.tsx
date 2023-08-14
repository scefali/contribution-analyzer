import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'

import { sendEmail } from '~/utils/email.server.ts'
import { TimePeriod, getPrsForSummary } from '~/utils/github.ts'

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
	const prsPerUser = await Promise.all(
		teamMembers.map(async member => {
			const prs = await getPrsForSummary({
				githubCookie: session.get('github-auth'),
				userName: member.gitHubUserName,
				timePeriod: TimePeriod.OneWeek,
			})
			return prs
		}),
	)
  console.log(prsPerUser)

	const { status, error } = await sendEmail({
		react: <TeamSummary />,
		to: 'scefali@sentry.io',
		subject: 'subject',
	})

	console.log({ status, error })
	if (status !== 'success') {
		return {
			status: 500,
			payload: {
				status: 'error',
				message: 'Something went wrong',
			},
		}
	}
	return {
		status: 200,
		payload: {
			status: 'success',
		},
	}
}
