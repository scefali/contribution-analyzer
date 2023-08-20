import type { TeamMember } from '~/utils/types.ts'

import { FaTrash } from 'react-icons/fa/index.ts'
import { useFetcher } from '@remix-run/react'

interface Props {
	teamMember: TeamMember
}

export default function MemberItem({ teamMember }: Props) {
	const fetcher = useFetcher()
	return (
		<div className="grid" style={{ gridTemplateColumns: '60px 250px 20px' }}>
			{teamMember.avatarUrl && (
				<img
					src={teamMember.avatarUrl}
					alt={teamMember.gitHubUserName}
					className="w-12 h-12 rounded-full"
				/>
			)}
			<span className="my-auto">{teamMember.name}</span>
			<div className="my-auto">
				<fetcher.Form action={`/app/team/${teamMember.id}`} method="DELETE">
					<button type="submit">
						<FaTrash />
					</button>
				</fetcher.Form>
			</div>
		</div>
	)
}
