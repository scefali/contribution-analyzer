import { NavLink } from '@remix-run/react'
import { Fragment } from 'react'

import { Icon } from '#app/components/ui/icon.tsx'
import Github from '#app/images/github'

export default function Header({ inApp }: { inApp?: boolean }) {
	return (
		<header className="border-b-2 py-4">
			<nav className="container mx-auto flex items-center justify-between px-4">
				<div className="flex items-center">
					<NavLink to="/" className="text-2xl font-bold">
						Contribution Analyzer
					</NavLink>
				</div>
				<div className="flex justify-end gap-2">
					{inApp && (
						<Fragment>
							<NavLink
								to="/app/summary"
								className="text-4xl flex flex-col  font-bold md:flex-row"
							>
								<div className="m-auto md:mr-1">
									<Icon name="file-text" />
								</div>
								Summary
							</NavLink>
							<NavLink
								to="/app/team"
								className="text-4xl flex flex-col font-bold md:flex-row"
							>
								<div className="m-auto md:mr-1">
									<Icon name="avatar" />
								</div>
								Team
							</NavLink>
						</Fragment>
					)}
					<div className="flex items-center">
						<a
							href="https://github.com/scefali/contribution-analyzer"
							className="text-4xl w-8 flex flex-col md:flex-row"
						>
							<Github className="m-auto md:mr-1" />
							Source
						</a>
					</div>
				</div>
			</nav>
		</header>
	)
}
