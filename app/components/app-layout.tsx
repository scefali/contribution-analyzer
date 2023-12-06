export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			id="app-layout"
			className="flex w-full max-w-screen-xl flex-row justify-between p-4"
		>
			<div
				style={{
					width: '100%',
				}}
				className="box-border"
			>
				{children}
			</div>
			<div />
		</div>
	)
}
