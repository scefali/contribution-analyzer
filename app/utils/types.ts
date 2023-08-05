import type { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

export type TeamMember = Prisma.PromiseReturnType<
	PrismaClient['teamMember']['create']
>
