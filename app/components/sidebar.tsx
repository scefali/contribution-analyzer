import { NavLink } from '@remix-run/react'

import { FaFileCode, FaUsers } from 'react-icons/fa/index.js'
import Github from '~/images/github'

export default function Sidebar() {
	return (
		<header className="border-b-2 py-4">
			<nav className="container mx-auto flex items-center justify-between px-4">
				<div className="flex items-center">
					<NavLink to="/" className="text-2xl font-bold">
						Contribution Analyzer
					</NavLink>
				</div>
				<div className="flex justify-end gap-2">
					<NavLink to="/app/summary" className="text-4xl flex font-bold">
						<div className="m-auto mr-1">
							<FaFileCode />
						</div>
						Summary
					</NavLink>
					<NavLink to="/app/team" className="text-4xl flex font-bold">
						<div className="m-auto mr-1">
							<FaUsers />
						</div>
						Team
					</NavLink>
					<div className="flex items-center">
						<a
							href="https://github.com/scefali/contribution-analyzer"
							className="w-8 flex "
						>
							<Github className="mr-1 my-auto" />
							Source Code
						</a>
					</div>
				</div>
			</nav>
		</header>
	)
}
