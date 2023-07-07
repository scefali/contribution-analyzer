import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'
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
import { Suspense, useEffect, useState } from 'react'

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

// export async function loader({ request, params }: DataFunctionArgs) {
// 	const session = await getSession(request.headers.get('Cookie'))
// 	const githubCookie = session.get('github-auth')

// 	const userName = 'scefali'
// 	const name2Use = 'Stephen Cefali'
// 	return eventStream(request.signal, function setup(send) {
// 		generateSummary({
// 			userName,
// 			name: name2Use,
// 			githubCookie,
// 		}).then(async generator => {
// 			while (true) {
// 				const newItem = await generator.next()
// 				console.log({ newItem })
// 				if (newItem.done) {
// 					send({ type: 'done' })
// 					return
// 				}
// 				send({ type: 'data', data: newItem.value })
// 			}
// 		})
// 	})
// }

export default function App() {
	const navigation = useNavigation()
	const actionData = useActionData<typeof action>()
	const data = useLoaderData()

	const queryParams = useSearchParams()[0]
	// const error = actionData?.status === 'error' ? actionData.message : null
	// const disableButton = navigation.state === 'submitting'
	// const userName = data?.userName
	// const queryParams =
	// 	actionData?.status === 'success'
	// 		? new URLSearchParams({ userName, name: data?.name })
	// 		: new URLSearchParams()

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
	console.log({ stream })

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
					/>
					{/* {error && <p className="text-red-500">{error}</p>} */}
					<Button type="submit" className="mt-4" disabled={disableButton}>
						{disableButton && <Loader2 className="animate-spin" />}
						Submit
					</Button>
					<div className="mt-4">{renderText()}</div>
				</Form>
			</div>
		</div>
	)
}
