import  { type Prisma, type PrismaClient } from '@prisma/client'

// TODO: don't need to import types like this
export type TeamMember = Prisma.PromiseReturnType<
	PrismaClient['teamMember']['create']
>
export type User = Prisma.PromiseReturnType<PrismaClient['user']['create']>

export type MetadataAction = {
	action: 'metadata'
	data: ProcessedPrData
}

export type SummaryAction = {
	action: 'summary'
	data: {
		text: string
		id: number
	}
}

export type SummaryOrMetadata = MetadataAction | SummaryAction

export type StreamData =
	| {
			action: 'error'
			message: string
	  }
	| MetadataAction
	| SummaryAction
	| {
			action: 'stop'
	  }
	| {
			action: 'redirect'
			url: string
	  }

export type ProcessedPrData = {
	title: string
	link: string
	id: number
	closedAt: string
	summary: string
	repo: string
	repoLink: string
}
