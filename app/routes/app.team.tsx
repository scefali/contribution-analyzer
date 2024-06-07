
import { Prisma } from '@prisma/client'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useNavigation,
	useLoaderData,
	useFetcher,
} from '@remix-run/react'
import { Loader2 } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'

import { Button } from '#app/@/components/ui/button.tsx'
import { Input } from '#app/@/components/ui/input.tsx'
import AppLayout from '#app/components/app-layout'
import MemberItem from '#app/components/member-item.tsx'
import { getGithubToken } from '#app/orm/user.server'
import { GITHUB_LOGIN_URL } from '#app/utils/constants'
import { prisma } from '#app/utils/db.server.ts'
import { BadRefreshTokenError } from '#app/utils/errors'
import { getUser } from '#app/utils/github.ts'
import { getSession } from '#app/utils/session.server.ts'

type ActionData = { status: 'error'; message: string } | { status: 'success' }

export async function action({
	request,
}: ActionFunctionArgs): Promise<TypedResponse<ActionData>> {
	const formData = await request.formData()
	const userName = formData.get('userName')

	if (typeof userName !== 'string' || !userName) {
		return json(
			{ status: 'error', message: 'Invalid username' },
			{ status: 400 },
		)
	}

	const session = await getSession(request.headers.get('Cookie'))

	try {
		const gitHubApiToken = await getGithubToken(session.get('user-id'))
		const userId: number = session.get('user-id')
		// TODO: fix this
		const gitHubUser: any = await getUser({
			userName,
			githubCookie: gitHubApiToken,
		})
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
	} catch (e: unknown) {
		if (e instanceof BadRefreshTokenError) {
			return redirect(GITHUB_LOGIN_URL)
		} else if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return json(
					{ status: 'error', message: 'Team member already exists' },
					{ status: 400 },
				)
			}
			if (e.code === 'P2025') {
				return redirect(GITHUB_LOGIN_URL)
			}
		} else if (e instanceof Response && !e.ok) {
			if (e.status === 404) {
				return json(
					{ status: 'error', message: 'GitHub user not found' },
					{ status: 404 },
				)
			}
		}
		console.error(e)
		return json({ status: 'error', message: 'Unknown error' }, { status: 500 })
	}
	return json({ status: 'success' })
}

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const userId: number = session.get('user-id')

	const teamMembersCount = await prisma.teamMember.count()
	console.log(`Number of team members in the database: ${teamMembersCount}`)

	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: userId,
		},
	})
	return { teamMembers }
}

export default function Team() {
	const { teamMembers } = useLoaderData<ReturnType<typeof loader>>()
	const generateReportFetcher = useFetcher<{
		status: string
		message: string
	}>()
	const navigation = useNavigation()
	const actionData = useActionData<ActionData>()
	const [showSuccessMessage, setShowSuccessMessage] = useState(false)

	useEffect(() => {
		if (generateReportFetcher.data?.status === 'success') {
			setShowSuccessMessage(true)
			const timer = setTimeout(() => setShowSuccessMessage(false), 3000)
			return () => clearTimeout(timer)
		}
	}, [generateReportFetcher.data])

	return (
		<AppLayout>
			<div className="m-auto flex min-h-screen	max-w-3xl flex-col p-4">
				<Form className="w-full max-w-md" action="/app/team" method="POST">
					<h1 className="text-lg text-center font-bold">
						Add a GitHub User to Team
					</h1>
					<Input
						type="text"
						placeholder="GitHub Username"
						className="mt-4 max-w-md"
						required
						name="userName"
					/>
					<div>
						<Button
							type="submit"
							className="mt-4"
							disabled={navigation.state === 'submitting'}
							variant="white"
						>
							{navigation.state === 'submitting' && (
								<Loader2 className="animate-spin" />
							)}
							Add to Team
						</Button>
					</div>
					{actionData && actionData.status === 'error' && (
						<div className="mt-4 text-red-500">{actionData.message}</div>
					)}
				</Form>
				<generateReportFetcher.Form
					method="POST"
					action="/app/team/generate-report"
					className="w-full mt-4 max-w-md" // Apply the same max-width as the form above for alignment
				>
					<Button
						type="submit"
						className="mt-4"
						disabled={generateReportFetcher.state === 'submitting'}
						variant="white"
					>
						{generateReportFetcher.state === 'submitting' && (
							<Loader2 className="animate-spin" />
						)}
						Generate Weekly Report
					</Button>
					<div className="mt-2">
						Emails you the weekly report for all team members.
					</div>
				</generateReportFetcher.Form>
				{generateReportFetcher.data &&
					generateReportFetcher.data.status === 'error' && (
						<div className="mt-4 text-red-500">
							{generateReportFetcher.data.message}
						</div>
					)}
				{showSuccessMessage && <div className="text-green-500">Email Sent</div>}
				{teamMembers.length > 0 ? (
					<Fragment>
						<br />
						<div className="flex justify-between rounded-sm rounded-b-none bg-secondary p-2">
							<div>Member</div>
							<div>Delete</div>
						</div>
						<div className="border-x-2 border-t-2">
							{teamMembers.map((teamMember, index) => (
								<MemberItem key={index} teamMember={teamMember} />
							))}
						</div>
					</Fragment>
				) : null}
			</div>
		</AppLayout>
	)
}
