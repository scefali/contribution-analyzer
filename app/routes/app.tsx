import { type DataFunctionArgs, json } from '@remix-run/node'
import { generateSummary } from '~/utils/github.ts'
import { getSession } from '~/utils/session.server.ts'

export async function action({ request }: DataFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const githubCookie = session.get('github-auth')
	const formData = await request.formData()

	// if (typeof email !== 'string' || !email) {
	// 	return json({ message: 'Invalid email' }, { status: 400 })
	// }
	// TODO: look up user by email

	await generateSummary({ userName: 'leedongwei', githubCookie })
	return json({})
}

export default function App() {
	return (
		<div>
			<h1>App</h1>
			<form action="/app" method="POST">
				<input type="email" placeholder="Type in email" id="email"></input>
			</form>
		</div>
	)
}
