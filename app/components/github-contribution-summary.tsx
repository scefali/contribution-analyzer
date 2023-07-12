import { useNavigation } from '@remix-run/react'
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
			action: 'data'
			value: string
	  }

function GithubContributionSummary({ userName, timePeriod }: Props) {
	const navigation = useNavigation()
	const queryParams = new URLSearchParams({
		userName,
		timePeriod,
	})
	const rawStreamArray = useBufferedEventSource(
		`/github/stream?${queryParams.toString()}`,
		{
			event: 'githubData',
		},
	)
	const [text, setText] = useState('')
	useEffect(() => {
		const dataStreams = rawStreamArray.filter(rawStream => {
			const stream = rawStream ? (JSON.parse(rawStream) as StreamData) : null
			return stream?.action === 'data'
		})
		const dataStreamsText = dataStreams.map(rawStream => {
			const stream = rawStream
				? (JSON.parse(rawStream) as {
						action: 'data'
						value: string
				  })
				: null
			if (!stream) return ''
			return stream.value
		})
		setText((prevText: string) => prevText + dataStreamsText.join(''))
	}, [rawStreamArray])

	const [error, setError] = useState<string | null>(null)
	useEffect(() => {
		const errorStream = rawStreamArray.find(rawStream => {
			const stream = rawStream ? (JSON.parse(rawStream) as StreamData) : null
			return stream?.action === 'error'
		})
		// if stream has error set error state
		if (errorStream) {
			const stream = JSON.parse(errorStream) as {
				action: 'error'
				message: string
			}
			setError(stream.message)
		}
	}, [rawStreamArray])

	// clear the text when the user presses submitƒ
	useEffect(() => {
		if (navigation.state === 'loading') {
			setText('')
		}
	}, [navigation.state])

	const renderText = () => {
		if (!text) {
			return <p className="text-left">Loading...</p>
		}
		return <p className="text-left">{text}</p>
	}
	return (
		<div className="flex flex-col items-center p-4">
			{error && <p className="text-red-500">{error}</p>}
			<div className="mt-4 whitespace-pre-wrap">{renderText()}</div>
		</div>
	)
}

export default GithubContributionSummary
