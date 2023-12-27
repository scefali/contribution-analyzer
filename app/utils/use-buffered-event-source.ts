import { useEffect, useState, useRef } from 'react'

type EventSourceOptions = {
	init?: EventSourceInit
	event: string
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
	{ event, init }: EventSourceOptions,
) {
	const timeoutRef = useRef<number | null>(null)
	const [data, setData] = useState<Array<Event | null>>([])

	useEffect(() => {
		const eventSource = new EventSource(url, init)
		eventSource.addEventListener(event, handler)
		eventSource.onerror = function (errorEvent) {
			console.error('errorEvent', errorEvent)
			// set error message
			setData(oldData => [
				...oldData,
				{
					action: 'error',
					message: 'Unexpected error occurred',
				} as unknown as Event,
			])

			// close connection
			eventSource.removeEventListener(event, handler)
			eventSource.close()
		}

		// reset data if dependencies change
		setData([])

		function handler(incomingEvent: MessageEvent) {
			try {
				const data = JSON.parse(incomingEvent.data) as Event
				setData(oldData => [...oldData, data as Event])
				if (data.action === 'stop') {
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

	return data
}
