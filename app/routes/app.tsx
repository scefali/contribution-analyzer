import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
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
} from '@remix-run/react'
import { useEventSource } from 'remix-utils'

import { generateSummary, getUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/@/components/ui/select.tsx'

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

export default function App() {
	const actionData = useActionData<typeof action>()
	const queryParams = useSearchParams()[0]
	const navigation = useNavigation()
	console.log(navigation.state)

	const rawStream = useEventSource(`/github/stream?${queryParams.toString()}`, {
		event: 'githubData',
	})
	const stream = rawStream ? (JSON.parse(rawStream) as { value: string }) : null
	const streamText =
		stream?.value !== 'UNKNOWN_EVENT_DATA' ? stream?.value || '' : ''
	const [text, setText] = useState('')
	useEffect(() => {
		setText((prevText: string) => prevText + streamText)
	}, [streamText])

	// clear the text when the user presses submit
	useEffect(() => {
		if (navigation.state === 'loading') {
			setText('')
		}
	}, [navigation.state])

	const hasUserName = queryParams.has('userName')
	const disableButton = false

	const renderText = () => {
		if (!hasUserName) {
			return null
		}
		if (!text) {
			return <p className="text-left">Loading...</p>
		}
		return <p className="text-left">{text}</p>
	}
	return (
		<div className="flex flex-col items-center p-4">
			<div className="max-w-2xl">
				<Form
					className="m-auto rounded-sm bg-secondary p-8 "
					action="/app"
					method="GET"
					style={{ width: '48rem' }}
				>
					<h1 className="text-lg font-bold">
						See a Summary of Github Contributions
					</h1>
					<Input
						type="text"
						placeholder="Type in GitHub Username"
						name="userName"
						className="mt-4 max-w-md"
						required
						defaultValue={queryParams.get('userName') || ''}
					/>
					<Select
						name="timePeriod"
						defaultValue={queryParams.get('timePeriod') || ''}
					>
						<SelectTrigger className="mt-4 w-[180px] bg-background ">
							<SelectValue placeholder="Time Period" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1w">1 Week</SelectItem>
							<SelectItem value="1m">1 Month</SelectItem>
							<SelectItem value="1y">1 Year</SelectItem>
						</SelectContent>
					</Select>

					{/* {error && <p className="text-red-500">{error}</p>} */}
					<Button type="submit" className="mt-4" disabled={disableButton}>
						{disableButton && <Loader2 className="animate-spin" />}
						Submit
					</Button>
					<div className="mt-4 whitespace-pre-wrap">{renderText()}</div>
				</Form>
			</div>
		</div>
	)
}
