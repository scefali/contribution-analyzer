import { useNavigation } from '@remix-run/react'
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { useBufferedEventSource } from '~/utils/use-buffered-event-source.ts'
import { DUMMY_SEND_DATA } from '~/utils/constants'

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
	| {
			action: 'stop'
	  }

function GithubContributionSummary({ userName, timePeriod }: Props) {
	const navigation = useNavigation()
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
	const [text, setText] = useState('')
	useEffect(() => {
		const dataStreamsText = streamArray.map(stream => {
			if (!stream) return ''
			if (stream.action !== 'data') return ''
			return stream.value
		})
		setText((prevText: string) => prevText + dataStreamsText.join(''))
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
	}, [streamArray])

	// clear the text when the user presses submitƒ
	useEffect(() => {
		if (navigation.state === 'loading') {
			setText('')
		}
	}, [navigation.state])

	const renderText = () => {
		if (!text && !error) {
			return <p className="text-left">Loading...</p>
		}
		// clean up the text
		return (
			<ReactMarkdown className="markdown-content text-left">
				{'-' +
					text
						.trim()
						.replaceAll(DUMMY_SEND_DATA, '')
						.replaceAll(/\r*\n+-*/g, '\n--')}
			</ReactMarkdown>
		)
	}
	return (
		<div className="flex flex-col pt-4 text-left">
			{error && <p className="text-red-500">{error}</p>}
			<div className="mt-4 whitespace-pre-wrap">{renderText()}</div>
		</div>
	)
}

export default GithubContributionSummary
