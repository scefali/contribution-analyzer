import TeamSummary from '#app/components/emails/team-summary'
import { prisma } from './db.server'
import { TimePeriod, generateSummary } from './github'
import { type ProcessedPrData, type User } from './types'

export async function generateTeamSummaryForUser(user: User) {
	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: user.id,
		},
	})
	// for each team member, generate a summary
	const summaryList = await Promise.all(
		teamMembers.map(async member => {
			const gitHubAuth = await prisma.gitHubAuth.findFirst({
				where: {
					userId: user.id,
				},
			})
			if (!gitHubAuth) {
				return []
			}
			const generators = await generateSummary({
				userId: user.id,
				name: member.name || 'Unknown',
				githubCookie: gitHubAuth.githubToken,
				userName: member.gitHubUserName,
				timePeriod: TimePeriod.OneWeek,
			})

			const prData: ProcessedPrData[] = []
			for await (const generator of generators) {
				while (true) {
					const newItem = await generator.next()
					console.log('newItem', newItem)
					if (newItem.done) {
						break
					}
					if (newItem.value.action === 'metadata') {
						prData.push({
							...newItem.value.data,
							summary: '',
						})
					} else if (newItem.value.action === 'summary') {
						const pr = prData.find(pr => pr.id === newItem.value.data.id)
						if (pr) {
							console.log('adding to summary', newItem.value.data.text)
							pr.summary += newItem.value.data.text
						}
					}
				}
			}
			return prData
		}),
	)
	return <TeamSummary summaryList={summaryList} teamMembers={teamMembers} />
}
