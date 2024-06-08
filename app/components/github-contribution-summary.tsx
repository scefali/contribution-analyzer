import { useNavigation, useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'

import { useBufferedEventSource } from '#app/utils/use-buffered-event-source.ts'
import { Spinner } from './spinner'
import { type ProcessedPrData, type StreamData } from '#app/utils/types.tsx'

interface Props {
	userName: string
	timePeriod: string
}

function GithubContributionSummary({ userName, timePeriod }: Props) {
	const navigation = useNavigation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams({
		userName,
		timePeriod,
	})
	const streamArray = useBufferedEventSource<StreamData>(
		`/github/stream?${queryParams.toString()}`,
		{
			event: 'githubData',
		},
	)

	const [prs, setPrs] = useState<ProcessedPrData[]>([])
	useEffect(() => {
		// set up the metadata
		streamArray.forEach(stream => {
			if (!stream) return
			if (stream.action === 'metadata') {
				setPrs(prevPrs => {
					const prExists = prevPrs.some(pr => pr.id === stream.data.id)
					if (prExists) {
						return prevPrs
					} else {
						return [
							...prevPrs,
							{
								...stream.data,
								summary: '',
							},
						]
					}
				})
			}
		})
		// populate the summary
		const summmaries = streamArray.reduce((acc, stream) => {
			if (stream?.action !== 'summary') return acc
			if (!acc[stream.data.id]) {
				acc[stream.data.id] = ''
			}
			acc[stream.data.id] += stream.data.text
			return acc
		}, {} as Record<number, string>)
		setPrs(prevPrs => {
			return prevPrs.map(pr => {
				return {
					...pr,
					summary: summmaries[pr.id],
				}
			})
		})
	}, [streamArray])

	const [error, setError] = useState<string | null>(null)
	useEffect(() => {
		const errorStream = streamArray.find(stream => {
			return stream?.action === 'error'
		})
		// if stream has error set error state
		if (errorStream && errorStream.action === 'error') {
			setError(errorStream.message)
		}
		const redirectStream = streamArray.find(stream => {
			return stream?.action === 'redirect'
		})
		if (redirectStream && redirectStream.action === 'redirect') {
			navigate(redirectStream.url)
		}
	}, [streamArray, navigate])

	// clear the text when the user presses submitƒ
	useEffect(() => {
		if (navigation.state === 'loading') {
			setPrs([])
			setError(null)
		}
	}, [navigation.state])

	const renderContent = () => {
		// TODO: prevent spinner from showing during page navigations to another page
		if (!prs.length && !error) {
			return (
				<div className="flex justify-center">
					<Spinner showSpinner />
				</div>
			)
		}
		if (prs.length) {
			return prs.map(pr => (
				<div key={pr.id}>
					<div className="flex flex-col md:flex-row md:gap-2">
						{new Date(pr.closedAt).toLocaleDateString()}:
						<a
							href={pr.repoLink}
							className="text-blue-500 underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{pr.repo}
						</a>
						<a
							className="text-blue-500 underline"
							href={pr.link}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Markdown>{pr.title}</Markdown>
						</a>
					</div>
					<Markdown>{pr.summary}</Markdown>
					<br />
				</div>
			))
		}
	}
	return (
		<div className="flex flex-col pt-4 text-left">
			{error && <p className="text-red-500">{error}</p>}
			<div className="whitespace-pre-wrap">{renderContent()}</div>
		</div>
	)
}

export default GithubContributionSummary
