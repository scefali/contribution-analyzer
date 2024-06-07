import { Outlet } from '@remix-run/react'
import Sidebar from '#app/components/header'

export default function GitHub() {
	return (
		<div className="flex flex-col md:flex-col">
			<div className="z-50 sm:items-start	md:items-center ">
				<Sidebar />
			</div>
			<div className="mt-6 md:mt-0" style={{ width: '100%' }}>
				<Outlet />
			</div>
		</div>
	)
}
