import { RequestError } from '@octokit/request-error'
import type { OctokitResponse } from '@octokit/types'

import { prisma } from '~/utils/db.server'
import { BadRefreshTokenError } from '~/utils/errors'
import { app } from '~/utils/github.ts'

export const getGithubToken = async (userId: number) => {
	let gitHubAuth;
	gitHubAuth = await prisma.gitHubAuth.findUniqueOrThrow({
		where: {
			userId,
		},
	})
	const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000)
	if (new Date(gitHubAuth.githubTokenExpiresAt) < oneHourFromNow) {
		console.log('Updating User')
		try {
			const { data } = await app.refreshToken({
				refreshToken: gitHubAuth.githubRefreshToken,
			})
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
			if (e instanceof RequestError) {
				// TODO: avoid type casting
				if (
					(e.response as OctokitResponse<{ error: string }>)?.data?.error ===
					'bad_refresh_token'
				) {
					throw new BadRefreshTokenError()
				}
			}
			
			throw e
		}
	}
	return gitHubAuth.githubToken
}
