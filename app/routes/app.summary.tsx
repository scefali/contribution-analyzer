import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
	redirect,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'

import {
	Form,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'

import { getMyUser } from '~/utils/github.ts'
import { getSession, destroySession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/@/components/ui/select.tsx'
import GithubContributionSummary from '~/components/github-contribution-summary.tsx'

type ActionData =
	| { status: 'error'; message: string }
	| { userName: string; status: 'success' }

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
	return json({ status: 'success', userName })
}

export async function loader({ request }: DataFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const githubCookie = session.get('github-auth')

	// check if our token is still valid when the page laods
	try {
		// check if token still valid
		await getMyUser({ githubCookie })
	} catch (e) {
		// TODO: better error handling
		// if not, redirect to the the install page after clearing the session
		return redirect(`/github/install`, {
			headers: {
				'Set-Cookie': await destroySession(session),
			},
		})
	}
	return null
}

export default function Summary() {
	const queryParams = useSearchParams()[0]
	const userName = queryParams.get('userName')
	const timePeriod = queryParams.get('timePeriod')
	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'
	const disableButton = !userName || !timePeriod || submitting
	return (
		<div className="flex flex-col items-center p-4">
			<div className="w-150">
				<Form
					className="m-auto rounded-sm bg-secondary p-8 "
					action="/app/summary"
					method="GET"
				>
					<h1 className="text-lg font-bold">
						See a Summary of Github Contributions
					</h1>
					<Input
						type="text"
						placeholder="GitHub Username"
						name="userName"
						className="mt-4 max-w-md"
						required
						defaultValue={queryParams.get('userName') || ''}
					/>
					<Select
						name="timePeriod"
						defaultValue={queryParams.get('timePeriod') || ''}
						required
					>
						<SelectTrigger className="mt-4 w-[180px] bg-background ">
							<SelectValue placeholder="Time Period" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1w">1 Week</SelectItem>
							<SelectItem value="1m">1 Month</SelectItem>
							<SelectItem value="3m">3 Months</SelectItem>
							<SelectItem value="1y">1 Year</SelectItem>
						</SelectContent>
					</Select>
					<Button type="submit" className="mt-4" disabled={disableButton}>
						{submitting && <Loader2 className="animate-spin" />}
						Submit
					</Button>
					{userName && timePeriod && (
						<GithubContributionSummary
							userName={userName}
							timePeriod={timePeriod}
						/>
					)}
				</Form>
			</div>
		</div>
	)
}
