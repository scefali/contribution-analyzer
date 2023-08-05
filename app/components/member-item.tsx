import type { TeamMember } from '~/utils/types.ts'

export default function MemberItem({ teamMember }: { teamMember: TeamMember }) {
	console.log(teamMember)
	return (
		<div className="flex">
			{teamMember.avatarUrl && (
				<img
					src={teamMember.avatarUrl}
					alt={teamMember.gitHubUserName}
					className="w-12 mr-4 h-12 rounded-full"
				/>
			)}
			<span className="m-auto">{teamMember.name}</span>
		</div>
	)
}
