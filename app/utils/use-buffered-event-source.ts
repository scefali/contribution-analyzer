import { useEffect, useState, useRef } from 'react'

type EventSourceOptions = {
	init?: EventSourceInit
	event?: string
	flushTime?: number
}

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @returns The last event received from the server
 */
export function useBufferedEventSource(
	url: string | URL,
	{ event = 'message', init, flushTime = 200 }: EventSourceOptions = {},
) {
	const timeoutRef = useRef<number | null>(null)
	const [data, setData] = useState<Array<string | null>>([])
	const [rawData, setRawData] = useState<Array<string | null>>([])

	useEffect(() => {
		const eventSource = new EventSource(url, init)
		eventSource.addEventListener(event ?? 'message', handler)

		// reset data if dependencies change
		setRawData([])

		function handler(event: MessageEvent) {
			setRawData(rawData => [...(rawData ?? []), event.data])
		}
		return () => {
			eventSource.removeEventListener(event ?? 'message', handler)
			eventSource.close()
		}
	}, [url, event, init])

	useEffect(() => {
		timeoutRef.current = window.setTimeout(() => {
      console.log('send data', rawData)
			setData(rawData)
      setRawData([])
		}, flushTime)
		return () =>
			timeoutRef.current ? window.clearTimeout(timeoutRef.current) : undefined
	}, [flushTime, rawData])

	return data
}
