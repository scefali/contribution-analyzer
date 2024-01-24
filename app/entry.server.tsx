import {
	createCookie,
	type HandleDocumentRequestFunction,
} from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import isbot from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'stream'
import { getEnv, init } from './utils/env.server.ts'
import { NonceProvider } from './utils/nonce-provider.ts'
import { Response } from '@remix-run/web-fetch'
import { cacheHeader } from 'pretty-cache-header'

const ABORT_DELAY = 5000

init()
global.ENV = getEnv()

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('~/utils/monitoring.server.ts').then(({ init }) => init())
}

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>

let versionCookie = createCookie('version', {
	path: '/', // make sure the cookie we receive the request on every path
	secure: false, // enable this in prod
	httpOnly: true, // only for server-side usage
	maxAge: 60 * 60 * 24 * 365, // keep the cookie for a year
})

export default async function handleRequest(...args: DocRequestArgs) {
	const [
		request,
		responseStatusCode,
		responseHeaders,
		remixContext,
		loadContext,
	] = args
	responseHeaders.set('fly-region', process.env.FLY_REGION ?? 'unknown')
	responseHeaders.set('fly-app', process.env.FLY_APP_NAME ?? 'unknown')
	const { version } = remixContext.manifest // get the build version

	// if the response doesn't already have a cache-control header, add one
	if (
		!responseHeaders.has('cache-control') &&
		request.method === 'GET' &&
		request.url !== ''
	) {
		responseHeaders.append(
			'cache-control',
			cacheHeader({
				public: true, // cache on CDN
				maxAge: '60s', // cache time
				staleWhileRevalidate: '1y', // enables ISR
				staleIfError: '1y', // enables ISR
			}),
		)
	}

	// Add new headers to the response
	responseHeaders.append('Vary', 'Cookie')
	responseHeaders.append('Set-Cookie', await versionCookie.serialize(version))

	const callbackName = isbot(request.headers.get('user-agent'))
		? 'onAllReady'
		: 'onShellReady'

	const nonce = String(loadContext.cspNonce) ?? undefined
	return new Promise((resolve, reject) => {
		let didError = false

		const { pipe, abort } = renderToPipeableStream(
			<NonceProvider value={nonce}>
				<RemixServer context={remixContext} url={request.url} />
			</NonceProvider>,
			{
				[callbackName]: () => {
					const body = new PassThrough()
					responseHeaders.set('Content-Type', 'text/html')
					resolve(
						new Response(body, {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						}),
					)
					pipe(body)
				},
				onShellError: (err: unknown) => {
					reject(err)
				},
				onError: (error: unknown) => {
					didError = true

					console.error(error)
				},
			},
		)

		setTimeout(abort, ABORT_DELAY)
	})
}

export async function handleDataRequest(response: Response) {
	response.headers.set('fly-region', process.env.FLY_REGION ?? 'unknown')
	response.headers.set('fly-app', process.env.FLY_APP_NAME ?? 'unknown')

	return response
}
