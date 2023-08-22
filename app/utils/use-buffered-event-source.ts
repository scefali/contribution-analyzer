import { useEffect, useState, useRef } from 'react'

type EventSourceOptions = {
	init?: EventSourceInit
	event: string
	flushTime?: number
}

type BaseEvent =
	| {
			action: 'stop'
	  }
	| ({
			action: string
	  } & Record<string, unknown>)

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @returns The last event received from the server
 */
export function useBufferedEventSource<Event extends BaseEvent>(
	url: string | URL,
	{ event, init, flushTime = 100 }: EventSourceOptions,
) {
	const timeoutRef = useRef<number | null>(null)
	const [data, setData] = useState<Array<Event | null>>([])
	const [bufferedData, setBufferedData] = useState<Array<Event | null>>([])
	const [hasStopped, setHasStopped] = useState(false)

	useEffect(() => {
		const eventSource = new EventSource(url, init)
		eventSource.addEventListener(event, handler)
		console.log('add event listener', event)

		// reset data if dependencies change
		setBufferedData([])

		function handler(incomingEvent: MessageEvent) {
			try {
				const data = JSON.parse(incomingEvent.data) as Event
				setBufferedData(bufferedData => [
					...(bufferedData ?? []),
					data as Event,
				])
				if (data.action === 'stop') {
					console.log('stop')
					setHasStopped(true)
					if (timeoutRef.current) {
						clearTimeout(timeoutRef.current)
						timeoutRef.current = null
					}
					eventSource.removeEventListener(event, handler)
					eventSource.close()
				}
			} catch (error) {
				console.error('error', error)
			}
		}
		return () => {
			eventSource.removeEventListener(event, handler)
			eventSource.close()
		}
	}, [url, event, init])

	useEffect(() => {
		timeoutRef.current = window.setTimeout(() => {
			setData(bufferedData)
			setBufferedData([])
		}, flushTime)
		return () =>
			timeoutRef.current ? window.clearTimeout(timeoutRef.current) : undefined
	}, [flushTime, bufferedData, hasStopped])

	return data
}
