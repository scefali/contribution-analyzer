import { cronTrigger } from '@trigger.dev/sdk'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '~/utils/email.server.ts'
import type { User } from '@prisma/client'
import { client } from '~/trigger.server'
import { generateTeamSummaryForUser } from '~/utils/reports'

const prisma = new PrismaClient()

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
	// TODO: better handling
	if (!user.email) {
		return
	}
	const component = await generateTeamSummaryForUser(user)

	const { status, error } = await sendEmail({
		react: component,
		to: user.email,
		subject: 'Github Contribution Report for Team',
	})
	if (status !== 'success') {
		throw new Error(error.message)
	}
}
