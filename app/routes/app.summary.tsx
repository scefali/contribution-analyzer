import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'

import { Form, useNavigation, useSearchParams } from '@remix-run/react'

import { getSession } from '#app/utils/session.server.ts'
import { Input } from '#app/@/components/ui/input.tsx'
import { Button } from '#app/@/components/ui/button.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/@/components/ui/select.tsx'
import GithubContributionSummary from '#app/components/github-contribution-summary.tsx'
import AppLayout from '#app/components/app-layout'
import { prisma } from '#app/utils/db.server'
import { GITHUB_LOGIN_URL } from '#app/utils/constants'

type ActionData =
	| { status: 'error'; message: string }
	| { userName: string; status: 'success' }

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
	return json({ status: 'success', userName })
}

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const userId = session.get('user-id')
	if (!userId) {
		return redirect(GITHUB_LOGIN_URL)
	}
	const user = await prisma.user.findUnique({
		where: { id: userId },
	})
	return { user }
}

export default function Summary() {
	const queryParams = useSearchParams()[0]
	const userName = queryParams.get('userName')
	const timePeriod = queryParams.get('timePeriod')
	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'
	const disableButton = submitting
	return (
		<AppLayout>
			<Form
				className="m-auto max-w-sm md:max-w-md rounded-sm p-8"
				action="/app/summary"
				method="GET"
			>
				<h1 className="text-lg font-bold text-center">
					See a Summary of Github Contributions
				</h1>
				<Input
					type="text"
					placeholder="GitHub Username"
					name="userName"
					required
					className="w-full max-w-md mx-auto"
					defaultValue={queryParams.get('userName') || ''}
				/>
				<Select
					name="timePeriod"
					defaultValue={queryParams.get('timePeriod') || ''}
					required
				>
					<SelectTrigger className="mt-4 bg-background w-full max-w-md mx-auto">
						<SelectValue placeholder="Time Period" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="1w">1 Week</SelectItem>
						<SelectItem value="1m">1 Month</SelectItem>
						<SelectItem value="3m">3 Months</SelectItem>
						<SelectItem value="1y">1 Year</SelectItem>
					</SelectContent>
				</Select>
				<Button type="submit" className="mt-4 mx-auto" disabled={disableButton}>
					{submitting && <Loader2 className="animate-spin" />}
					Submit
				</Button>
			</Form>
			{userName && timePeriod && (
				<GithubContributionSummary
					userName={userName}
					timePeriod={timePeriod}
				/>
			)}
		</AppLayout>
	)
}
