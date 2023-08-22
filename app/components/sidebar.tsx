import { NavLink } from '@remix-run/react'

import { FaFileCode, FaUsers } from 'react-icons/fa/index.js'

export default function Sidebar() {
	return (
		<header className="sticky inset-0">
			<nav className="flex flex-col items-start gap-4 px-4 py-2">
				<NavLink to="/app/summary" className="text-4xl flex font-bold">
					<div className='m-auto mr-1'>
						<FaFileCode />
					</div>
					Summary
				</NavLink>
				<NavLink to="/app/team" className="text-4xl flex font-bold">
					<div className='m-auto mr-1'>
						<FaUsers />
					</div>
					Team
				</NavLink>
			</nav>
		</header>
	)
}
