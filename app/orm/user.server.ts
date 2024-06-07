
import { prisma } from '#app/utils/db.server.ts'
import { BadRefreshTokenError } from '#app/utils/errors.tsx'

export const getGithubToken = async (userId: number) => {
	let gitHubAuth;
	gitHubAuth = await prisma.gitHubAuth.findUniqueOrThrow({
		where: {
			userId,
		},
	})
	const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000)
	if (new Date(gitHubAuth.githubTokenExpiresAt) < oneHourFromNow) {
		try {
			const response = await fetch(`https://github.com/login/oauth/access_token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET,
					refresh_token: gitHubAuth.githubRefreshToken,
					grant_type: 'refresh_token',
				}),
			});
			const data: any = await response.json();
			// TODO better way of updating data
			await prisma.gitHubAuth.update({
				where: {
					userId: userId,
				},
				data: {
					githubToken: data.access_token,
					githubTokenExpiresAt: new Date(
						new Date().getTime() + data.expires_in * 1000,
					),
					githubRefreshToken: data.refresh_token,
				},
			})
			gitHubAuth = await prisma.gitHubAuth.findUniqueOrThrow({
				where: {
					userId,
				},
			})
		} catch (e) {
			// TODO: handle refresh token expiration
			// if (e instanceof RequestError) {
			// 	// TODO: avoid type casting
			// 	if (
			// 		(e.response as OctokitResponse<{ error: string }>)?.data?.error ===
			// 		'bad_refresh_token'
			// 	) {
			// 		throw new BadRefreshTokenError()
			// 	}
			// }

			throw e
		}
	}
	return gitHubAuth.githubToken
}
