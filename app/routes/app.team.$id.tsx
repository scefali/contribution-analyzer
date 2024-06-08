import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
} from '@remix-run/node'

import { prisma } from '#app/utils/db.server.ts'
import { getSession } from '#app/utils/session.server.ts'

type ActionData = { status: 'error'; message: string } | { status: 'success' }

export async function action({
	request,
	params,
}: DataFunctionArgs): Promise<TypedResponse<ActionData>> {
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')
	const teamMemberId = params.id
	if (!teamMemberId) {
		return json(
			{ status: 'error', message: 'Invalid team member id' },
			{ status: 400 },
		)
	}

	// TODO: find a cleaner way of doing this
	const teamMember = await prisma.teamMember.findUnique({
		where: {
			id: Number(teamMemberId),
		},
	})
	if (teamMember?.ownerId !== userId) {
		return json(
			{ status: 'error', message: 'Cannot find team member' },
			{ status: 404 },
		)
	}

	await prisma.teamMember.delete({
		where: {
			id: Number(teamMemberId),
		},
	})

	// await prisma.teamMember.delete({
	//   where: {
	//     ownerId: userId,
	//     id: Number(teamMemberId),
	//   },
	// })

	return json({ status: 'success' })
}
