import {
	type DataFunctionArgs,
	type TypedResponse,
	json,
} from '@remix-run/node'
import { Loader2 } from 'lucide-react'
import { Form, useActionData, useNavigation } from '@remix-run/react'

import { generateSummary, getUser } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'

type ActionData =
	| { status: 'error'; message: string }
	| { text: string; status: 'success' }

export async function action({
	request,
}: DataFunctionArgs): Promise<TypedResponse<ActionData>> {
	const session = await getSession(request.headers.get('Cookie'))
	const githubCookie = session.get('github-auth')
	const formData = await request.formData()
	const userName = formData.get('userName')
	console.log({ userName, githubCookie })

	if (typeof userName !== 'string' || !userName) {
		return json(
			{ status: 'error', message: 'Invalid username' },
			{ status: 400 },
		)
	}
	const {
		data: { name },
	} = await getUser({ userName, githubCookie })
	const name2Use = name || userName
	const text = await generateSummary({ userName, name: name2Use, githubCookie })
	return json({ status: 'success', text })
}

export default function App() {
	const navigation = useNavigation()
	const actionData = useActionData<typeof action>()
	const error = actionData?.status === 'error' ? actionData.message : null
	const text = actionData?.status === 'success' ? actionData.text : null
	const disableButton = navigation.state === 'submitting'
	return (
		<div className="flex flex-col items-center p-4">
			<div className="max-w-xl">
				<Form
					className="m-auto max-w-lg rounded-sm bg-secondary p-8 "
					action="/app"
					method="POST"
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
					{error && <p className="text-red-500">{error}</p>}
					<Button type="submit" className="mt-4" disabled={disableButton}>
						{disableButton && <Loader2 className="animate-spin" />}
						Submit
					</Button>
					{text && <p className="mt-4">{text}</p>}
				</Form>
			</div>
		</div>
	)
}
