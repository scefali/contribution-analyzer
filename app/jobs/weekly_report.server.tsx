import { cronTrigger } from '@trigger.dev/sdk'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '~/utils/email.server.ts'
import { TimePeriod, generateSummary } from '~/utils/github.ts'
import TeamSummary from '~/components/emails/team-summary.tsx'
import type { User } from '@prisma/client'
import { client } from '~/trigger.server'

const prisma = new PrismaClient()

console.log('weekly-report-job')
export const job = client.defineJob({
	id: 'weekly-report-job',
	name: 'Weekly Report Job',
	version: '1.0.0',
	// This job triggers every Monday at 00:00
	trigger: cronTrigger({ cron: '0 0 * * 1' }),
	run: async (_, io) => {
		try {
			// Fetch all users (team members)
			// fetch all users
			const users = await prisma.user.findMany()
			// for each user, fetch their team members
			await Promise.all(users.map(generateSummaryForUser))
		} catch (error: any) {
			await io.logger.error(`Error in weekly report job: ${error.message}`)
		}
	},
})

async function generateSummaryForUser(user: User) {
	const teamMembers = await prisma.teamMember.findMany({
		where: {
			ownerId: user.id,
		},
	})
	if (teamMembers.length === 0) {
		return
	}

	// for each team member, generate a summary
	const summaryList = await Promise.all(
		teamMembers.map(async member => {
			const iterator = await generateSummary({
				userId: user.id,
				name: member.name || 'Unknown',
				githubCookie: user.githubToken,
				userName: member.gitHubUserName,
				timePeriod: TimePeriod.OneWeek,
			})
			const output = []
			for await (const value of iterator) {
				output.push(value)
			}
			return output.join('')
		}),
	)

	const { status, error } = await sendEmail({
		react: <TeamSummary summaryList={summaryList} teamMembers={teamMembers} />,
		to: 'scefali@sentry.io',
		subject: 'Github Contribution Report for Team',
	})
	if (status !== 'success') {
		throw new Error(error.message)
	}
}
