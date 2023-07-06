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

	const stream = useEventSource(`/github/stream?${queryParams.toString()}`, {
		event: 'data',
	})
	const [text, setText] = useState('')
	useEffect(() => {
		setText((prevText: string) => prevText + stream)
	}, [stream])

	const disableButton = false
	return (
		<div className="flex flex-col items-center p-4">
			<div className="max-w-xl">
				<Form
					className="m-auto max-w-lg rounded-sm bg-secondary p-8 "
					action="/app"
					method="GET"
				>
					<h1 className="text-lg font-bold">
						See a Summary of Github Contributions
					</h1>
					<Input
						type="text"
						placeholder="Type in GitHub Username"
						name="userName"
						className="mt-4"
					/>
					{/* {error && <p className="text-red-500">{error}</p>} */}
					<Button type="submit" className="mt-4" disabled={disableButton}>
						{disableButton && <Loader2 className="animate-spin" />}
						Submit
					</Button>
					{stream && <p className="mt-4">{text}</p>}
					{/* <Suspense fallback={<span> {stream}% </span>}>
						<Await resolve={data.promise} errorElement={<p>Error loading!</p>}>
							{promise.text}
						</Await>
					</Suspense> */}
				</Form>
			</div>
		</div>
	)
}
