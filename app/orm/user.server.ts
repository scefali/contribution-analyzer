import { prisma } from '~/utils/db.server'

export const getGithubToken = async (userId: number) => {
	const user = await prisma.user.findUniqueOrThrow({
		where: {
			id: userId,
		},
	})
	return user.githubToken
}
