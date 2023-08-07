import { Outlet } from '@remix-run/react'
import Sidebar from '~/components/sidebar.tsx'

export default function App() {
	return (
		<div>
			<Sidebar />
			<Outlet />
		</div>
	)
}
