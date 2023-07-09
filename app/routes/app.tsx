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
} from '@remix-run/react'

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
import { destroySession } from '~/utils/session.server.ts'
import { useBufferedEventSource } from '~/utils/use-buffered-event-source.ts'

type ActionData =
	| { status: 'error'; message: string }
	| { userName: string; status: 'success' }

type StreamData =
	| {
			action: 'error'
			message: string
	  }
	| {
			action: 'data'
			value: string
	  }

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
		await getUser({ userName: 'scefali', githubCookie })
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

export default function App() {
	const queryParams = useSearchParams()[0]
	const navigation = useNavigation()

	// TODO: clean this stuff up cause it's really ugly
	// if no name put an ignore parameter there so backend ignores the request
	const userName = queryParams.get('userName') || ''
	const queryParamsToUse = userName
		? queryParams
		: new URLSearchParams({ ignore: '1' })

	const rawStreamArray = useBufferedEventSource(
		`/github/stream?${queryParamsToUse.toString()}`,
		{
			event: 'githubData',
		},
	)

	const [text, setText] = useState('')
	useEffect(() => {
		const dataStreams = rawStreamArray.filter(rawStream => {
			const stream = rawStream ? (JSON.parse(rawStream) as StreamData) : null
			return stream?.action === 'data'
		})
		const dataStreamsText = dataStreams.map(rawStream => {
			const stream = rawStream
				? (JSON.parse(rawStream) as {
						action: 'data'
						value: string
				  })
				: null
			if (!stream) return ''
			return stream.value
		})
		setText((prevText: string) => prevText + dataStreamsText.join(''))
	}, [rawStreamArray])

	const [error, setError] = useState<string | null>(null)
	useEffect(() => {
		const errorStream = rawStreamArray.find(rawStream => {
			const stream = rawStream ? (JSON.parse(rawStream) as StreamData) : null
			return stream?.action === 'error'
		})
		// if stream has error set error state
		if (errorStream) {
			const stream = JSON.parse(errorStream) as {
				action: 'error'
				message: string
			}
			setError(stream.message)
		}
	}, [rawStreamArray])

	// clear the text when the user presses submitƒ
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
						required
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

					{error && <p className="text-red-500">{error}</p>}
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
