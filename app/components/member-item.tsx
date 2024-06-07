import type { TeamMember } from '#app/utils/types'

import { Icon } from '#app/components/ui/icon.tsx'
import { useFetcher } from '@remix-run/react'

interface Props {
	teamMember: TeamMember
}

export default function MemberItem({ teamMember }: Props) {
	const fetcher = useFetcher()
	return (
		<div
			className="grid items-center border-b-2 p-4"
			style={{ gridTemplateColumns: '60px 1fr 20px', width: '100%' }}
		>
			{teamMember.avatarUrl && (
				<img
					src={teamMember.avatarUrl}
					alt={teamMember.gitHubUserName}
					className="w-12 h-12 rounded-full"
				/>
			)}
			<span>{teamMember.name}</span>
			<div>
				<fetcher.Form action={`/app/team/${teamMember.id}`} method="DELETE">
					<button type="submit">
						<Icon name="trash" />
					</button>
				</fetcher.Form>
			</div>
		</div>
	)
}
