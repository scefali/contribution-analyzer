export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-w-full flex-col items-center p-4">
			<div className="md:w-150">{children}</div>
		</div>
	)
}
