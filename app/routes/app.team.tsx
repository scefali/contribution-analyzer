import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'

import {
	Await,
	Form,
	useActionData,
	useNavigation,
	useLoaderData,
	useSearchParams,
	useFetcher,
} from '@remix-run/react'

import { getUser, getMyUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'
import { destroySession } from '~/utils/session.server.ts'
import { prisma } from '~/utils/db.server.ts'
import MemberItem from '~/components/member-item.tsx'

type ActionData = { status: 'error'; message: string } | { status: 'success' }

export async function action({
	request,
}: DataFunctionArgs): Promise<TypedResponse<ActionData>> {
	const formData = await request.formData()
	const userName = formData.get('userName')

	if (typeof userName !== 'string' || !userName) {
		return json(
			{ status: 'error', message: 'Invalid username' },
			{ status: 400 },
		)
	}

	const session = await getSession(request.headers.get('Cookie'))
	const githubCookie: string = session.get('github-auth')
	const userId: number = session.get('user-id')

	const { data: gitHubUser } = await getUser({ userName, githubCookie })
	console.log(gitHubUser)

	await prisma.teamMember.create({
		data: {
			name: gitHubUser.name,
			avatarUrl: gitHubUser.avatar_url,
			gitHubUserName: gitHubUser.login,
			owner: {
				connect: {
					id: userId,
				},
			},
		},
	})

	return json({ status: 'success' })
}

export async function loader({ request }: DataFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')

	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: userId,
		},
	})
	return { teamMembers }
}

export default function Team() {
	const { teamMembers } = useLoaderData<ReturnType<typeof loader>>()
	const fetcher = useFetcher()
	console.log({ fetcher })
	return (
		<div className="flex flex-col items-center p-4">
			<div className="w-150">
				<Form
					className="m-auto rounded-sm bg-secondary p-8"
					// eslint-disable-next-line remix-react-routes/require-valid-paths
					action="/app/team"
					method="POST"
				>
					<h1 className="text-lg font-bold">Add a GitHub User to Team</h1>
					<Input
						type="text"
						placeholder="GitHub Username"
						className="mt-4 max-w-md"
						required
						name="userName"
					/>
					<Button type="submit" className="mt-4">
						Add to Team
					</Button>
				</Form>
				<fetcher.Form method="POST" action="/app/team/generate-report">
					<Button
						type="submit"
						className="mt-4"
						disabled={fetcher.state !== 'idle'}
					>
						Generate Report
					</Button>
				</fetcher.Form>
				<div className="mt-8">
					<h2 className="text-lg font-bold">Team Members:</h2>
					<ul className="mt-4 space-y-4">
						{teamMembers.map((teamMember, index) => (
							<li key={index} className="flex items-center">
								<MemberItem teamMember={teamMember} />
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
