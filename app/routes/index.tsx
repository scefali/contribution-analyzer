import { Link } from '@remix-run/react'
import Github from '~/images/github.tsx'
import logo from '~/images/logo.webp'

function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="border-b-2 py-4">
				<nav className="container mx-auto flex items-center justify-between px-4">
					{/* Logo and title */}
					<div className="flex items-center">
						<Link to="/" className="text-2xl font-bold">
							Contribution Analyzer
						</Link>
					</div>

					{/* Navigation links */}
					<div className="flex items-center">
						<a
							href="https://github.com/scefali/contribution-analyzer"
							className="w-8 ml-4 flex "
						>
							<Github className="mr-1" />
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
					<Link
						to="/github/login"
						className="flex rounded bg-primary px-4 py-2 font-medium text-black"
					>
						<Github className="mr-1" />
						Get Started with GitHub
					</Link>
					{/* Illustration or logo */}
					<img
						className="max-w-md"
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
