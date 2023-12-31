import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'
import { Fragment, Suspense, useEffect, useState } from 'react'

import {
	Await,
	Form,
	useActionData,
	useNavigation,
	useLoaderData,
	useSearchParams,
	useFetcher,
} from '@remix-run/react'
import { Prisma } from '@prisma/client'
import { RequestError } from 'octokit'

import { getUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'
import { prisma } from '~/utils/db.server.ts'
import MemberItem from '~/components/member-item.tsx'
import AppLayout from '~/components/app-layout'
import { getGithubToken } from '~/orm/user.server'

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
	const gitHubApiToken = await getGithubToken(session.get('user-id'))
	const userId: number = session.get('user-id')

	try {
		const { data: gitHubUser } = await getUser({ userName, githubCookie: gitHubApiToken })
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
		console.log(e)
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return json(
					{ status: 'error', message: 'Team member already exists' },
					{ status: 400 },
				)
			}
		} else if (e instanceof RequestError) {
			if (e.status === 404) {
				return json(
					{ status: 'error', message: 'GitHub user not found' },
					{ status: 400 },
				)
			}
		}
		return json({ status: 'error', message: 'Unknown error' }, { status: 500 })
	}

	return json({ status: 'success' })
}

export async function loader({ request }: DataFunctionArgs) {
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
	const generateReportFetcher = useFetcher()
	const navigation = useNavigation()
	const actionData = useActionData<ActionData>()
	return (
		<AppLayout>
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
				{actionData && actionData.status === 'error' && (
					<div className="mt-4 text-red-500">{actionData.message}</div>
				)}
			</Form>
			<generateReportFetcher.Form
				method="POST"
				action="/app/team/generate-report"
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
			{teamMembers.length > 0 ? (
				<Fragment>
					<br />
					<div className="flex justify-between rounded-sm rounded-b-none bg-secondary p-2">
						<div>Member</div>
						<div>Actions</div>
					</div>
					<div className="border-x-2 border-t-2">
						{teamMembers.map((teamMember, index) => (
							<MemberItem key={index} teamMember={teamMember} />
						))}
					</div>
				</Fragment>
			) : null}
		</AppLayout>
	)
}
