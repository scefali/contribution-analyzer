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
			action: 'data'
			value: string
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
	console.log(streamArray)
	const [text, setText] = useState('')
	useEffect(() => {
		const dataStreamsText = streamArray.map(stream => {
			if (!stream) return ''
			if (stream.action !== 'data') return ''
			return stream.value
		})
		setText(dataStreamsText.join(''))
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
			setText('')
			setError(null)
		}
	}, [navigation.state])

	const renderText = () => {
		if (!text && !error) {
			return <p className="text-left">Loading...</p>
		}
		// clean up the text
		return (
			<ReactMarkdown className="markdown-content text-left">
				{text.trim()}
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
