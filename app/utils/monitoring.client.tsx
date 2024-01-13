import { useLocation, useMatches } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import Plausible from 'plausible-tracker'
import { useEffect } from 'react'

export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		integrations: [
			new Sentry.BrowserTracing({
				routingInstrumentation: Sentry.remixRouterInstrumentation(
					useEffect,
					useLocation,
					useMatches,
				),
			}),
			// Replay is only available in the client
			new Sentry.Replay(),
			new Sentry.Feedback({
				// Additional SDK configuration goes in here, for example:
				colorScheme: 'dark',
				formTitle: 'Feedback',
				messagePlaceholder: 'Tell us your feedback',
				buttonLabel: 'Feedback',
				submitButtonLabel: 'Submit',
			}),
		],
		beforeSend(event, hint) {
			// Check if it is an exception, and if so, show the report dialog
			if (
				event.exception &&
				!event?.exception?.values?.[0]?.value?.includes('AbortError')
			) {
				Sentry.showReportDialog({ eventId: event.event_id })
			}
			return event
		},

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,

		// Capture Replay for 10% of all sessions,
		// plus for 100% of sessions with an error
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
	})
	const { enableAutoPageviews } = Plausible({ trackLocalhost: true })
	enableAutoPageviews()
}
