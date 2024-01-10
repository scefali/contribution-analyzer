import { useNavigation, useNavigate } from '@remix-run/react'
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { useBufferedEventSource } from '~/utils/use-buffered-event-source.ts'

interface Props {
	userName: string
	timePeriod: string
}

type StreamData =
	| {
			action: 'error'
			message: string
	  }
	| {
			action: 'metadata'
			data: {
				title: string
				link: string
				id: number
				closedAt: string
			}
	  }
	| {
			action: 'summary'
			data: {
				text: string
				id: number
			}
	  }
	| {
			action: 'stop'
	  }
	| {
			action: 'redirect'
			url: string
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

	const [prs, setPrs] = useState<
		{
			id: number
			title: string
			link: string
			summary: string
			closedAt: string
		}[]
	>([])
	useEffect(() => {
		// set up the metadata
		streamArray.forEach(stream => {
			console.log('stream', stream)
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
								summary: '',
								...stream.data,
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
		if (!setPrs.length && !error) {
			return <p className="text-left">Loading...</p>
		}
		if (prs.length) {
			return prs.map(pr => (
				<div key={pr.id} className="mt-4">
					<div className="mt-4 whitespace-pre-wrap">
						{new Date(pr.closedAt).toLocaleDateString()}
					</div>
					<a
						className="text-blue-500 underline"
						href={pr.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						{pr.title}
					</a>
					<div className="mt-2">{pr.summary}</div>
					<br />
				</div>
			))
		}
	}
	return (
		<div className="flex flex-col pt-4 text-left">
			{error && <p className="text-red-500">{error}</p>}
			<div className="mt-4 whitespace-pre-wrap">{renderContent()}</div>
		</div>
	)
}

export default GithubContributionSummary
