export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div id="app-layout" className="w-full flex flex-col justify-between px-4 md:px-16">
			<div
				style={{
					width: '100%',
				}}
			>
				{children}
			</div>
			<div />
		</div>
	)
}
