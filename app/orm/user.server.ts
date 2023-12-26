import { prisma } from '~/utils/db.server'
import { app } from '~/utils/github.ts'

export const getGithubToken = async (userId: number) => {
	let user = await prisma.user.findUniqueOrThrow({
		where: {
			id: userId,
		},
	})
	const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000)
	if (new Date(user.githubTokenExpiresAt) < oneHourFromNow) {
		console.log('Updating User')
		const {
			data,
		} = await app.refreshToken({ refreshToken: user.githubRefreshToken })
		// TODO better way of updating data
		await prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				githubToken: data.access_token,
				githubTokenExpiresAt: new Date(
					new Date().getTime() + data.expires_in * 1000,
				),
				githubRefreshToken: data.refresh_token,
			},
		})
		user = await prisma.user.findUniqueOrThrow({
			where: {
				id: userId,
			},
		})
	}
	return user.githubToken
}
