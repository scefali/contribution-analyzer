import { redirect } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import Sidebar from '~/components/sidebar.tsx'

export function loader({ request }: { request: Request }) {
	if (request.url === '/app') {
		// redirect to the /app/summary route
		return redirect('/app/summary')
	}
	return { status: 200 }
}

export default function App() {
	return (
		<div className="flex min-w-full">
			<div className="z-50 sm:items-start	md:items-center">
				<Sidebar />
			</div>
			<div className="fixed min-w-full sm:mt-6 md:mt-0">
				<Outlet />
			</div>
		</div>
	)
}
