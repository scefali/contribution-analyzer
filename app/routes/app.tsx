import { type DataFunctionArgs, type TypedResponse, json } from '@remix-run/node'
import { generateSummary } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'
import { Input } from '~/@/components/ui/input.tsx'
import { Button } from '~/@/components/ui/button.tsx'
import { Form, useActionData, useNavigation } from '@remix-run/react'

type ActionData = { status: 'error'; message: string } | { text: string; status: 'success' }

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

	const text = await generateSummary({ userName, githubCookie })
	return json({ status: 'success', text })
}

export default function App() {
	const navigation = useNavigation()
	const actionData = useActionData<typeof action>()
	const error = actionData?.status === 'error' ? actionData.message : null
	return (
		<div className="p-4">
			<Form
				className="m-auto max-w-lg bg-secondary p-8"
				action="/app"
				method="POST"
			>
				<h1>See a Summary</h1>
				<Input
					type="text"
					placeholder="Type in GitHub Username"
					name="userName"
					className="mt-4"
				/>
				{error && <p className="text-red-500">{error}</p>}
				<Button
					type="submit"
					className={`mt-4 ${
						navigation.state === 'submitting' ? 'animate-spin' : ''
					}`}
				>
					Submit
				</Button>
			</Form>
		</div>
	)
}
