import {
	type ActionFunctionArgs,
	type TypedResponse,
	json,
} from '@remix-run/node'


import { prisma } from '#app/utils/db.server.ts'
import { sendEmail } from '#app/utils/email.server.ts'
import { LLMRateLimitError } from '#app/utils/errors'
import { generateTeamSummaryForUser } from '#app/utils/reports'
import { getSession } from '#app/utils/session.server.ts'

interface ActionData {
	status: 'error' | 'success'
	message?: string
}

export async function action({
	request,
}: ActionFunctionArgs): Promise<TypedResponse<ActionData>> {
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

	try {
		const component = await generateTeamSummaryForUser(user)
		const { status, error } = await sendEmail({
			react: component,
			to: user.email,
			subject: 'Github Contribution Report for Team',
		})
		if (status !== 'success') {
			return json({ status: 'error', message: error.message }, { status: 400 })
		}
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
		if (error instanceof Error) {
			return json({ status: 'error', message: error.message }, { status: 500 })
		}
		return json({ status: 'error', message: 'Unknown error' }, { status: 500 })
	}
	return json({ status: 'success' })
}
