import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (window.ENV.MODE === 'development') {
	import('~/utils/devtools.tsx').then(({ init }) => init())
}
if (window.ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('~/utils/monitoring.client.tsx').then(({ init }) => init())
}
startTransition(() => {
	hydrateRoot(document, <RemixBrowser />)
})
