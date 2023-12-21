import type { Prisma, PrismaClient } from '@prisma/client'

export type TeamMember = Prisma.PromiseReturnType<
	PrismaClient['teamMember']['create']
>

export type User = Prisma.PromiseReturnType<PrismaClient['user']['create']>
