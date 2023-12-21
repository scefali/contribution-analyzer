import { redirect } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import Sidebar from '~/components/sidebar.tsx'

export function loader({ request }: { request: Request }) {
	// TODO: clean up redirect
	if (request.url === '/app') {
		// redirect to the /app/summary route
		return redirect('/app/summary')
	}
	return { status: 200 }
}

export default function App() {
	return (
		<div className="flex flex-col md:flex-row">
			<div className="z-50 sm:items-start	md:items-center ">
				<Sidebar />
			</div>
			<div className="mt-6 md:mt-0" style={{ width: '100%' }}>
				<Outlet />
			</div>
		</div>
	)
}
