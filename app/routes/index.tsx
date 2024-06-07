import { NavLink } from '@remix-run/react'
import Github from '#app/images/github.tsx'
import logo from '#app/images/logo_380x380.webp'


function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="border-b-2 py-4">
				<nav className="container mx-auto flex items-center justify-between px-4">
					{/* Logo and title */}
					<div className="flex items-center">
						<NavLink to="/" className="text-2xl font-bold">
							Contribution Analyzer
						</NavLink>
					</div>

					<div className="flex items-center">
						<a
							href="https://github.com/scefali/contribution-analyzer"
							className="w-8 ml-4 flex "
						>
							<Github className="mr-1 my-auto" />
							Source Code
						</a>
					</div>
				</nav>
			</header>

			<main role="main" className="container mx-auto flex-grow px-4 py-12">
				<div className="flex flex-col items-center justify-center space-y-6 text-center">
					<h1 className="text-6xl font-bold">
						View a summary of GitHub contributions for yourself and your team
					</h1>
					<NavLink
						to="/app/summary"
						className="flex rounded bg-primary px-4 py-2 font-medium"
					>
						<Github className="mr-1 my-auto" />
						Get Started with GitHub
					</NavLink>
					<img
						className="max-w-md h-60 md:h-96"
						src={logo}
						alt="Contribution Analyzer Logo"
					/>
				</div>

				<div className="mt-12 grid grid-cols-2 gap-12">
					{/* Feature blocks */}
					<div>
						<h3 className="text-3xl font-semibold">Track your contributions</h3>
						<p>Generate summaries of your merged pull requests</p>
					</div>
					<div>
						<h3 className="text-3xl font-semibold">
							Track your team's contributions
						</h3>
						<p>Build your team and set up weekly reports</p>
					</div>
					{/* Add more feature blocks as needed */}
				</div>
			</main>
		</div>
	)
}

export default LandingPage
