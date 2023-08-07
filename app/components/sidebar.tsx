import { NavLink } from '@remix-run/react'



export default function Sidebar() {
	return (
		<header className="sticky inset-0">
			<nav className="justify-startgap flex items-center gap-4 bg-secondary px-4 py-2">
				<NavLink
					to="/app/summary"
          className="text-4xl font-bold"
				>
					Summary
				</NavLink>
				<NavLink to="/app/team" className="text-4xl font-bold">
					Team
				</NavLink>
			</nav>
		</header>
	)
}
