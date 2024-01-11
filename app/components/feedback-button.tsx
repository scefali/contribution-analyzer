import { Form, useLoaderData } from '@remix-run/react'
import { GrAnnounce } from 'react-icons/gr'
import * as Sentry from '@sentry/browser'
import { createPortal } from 'react-dom'

import { Button } from '~/@/components/ui/button'
import { Input } from '~/@/components/ui/input'
import { Textarea } from '~/@/components/ui/textarea'
import { useState } from 'react'

export default function FeedbackButton() {
	const { user } = useLoaderData()
	const [showModal, setShowModal] = useState(false)
	return (
		<>
			{showModal &&
				createPortal(
					<div
						className="fixed left-1/2 top-1/2 rounded-sm bg-accent p-8 "
						style={{ transform: 'translate(-50%, -50%)', width: '320px' }}
					>
						<Form
							className="m-auto flex flex-col"
							onSubmit={event => {
								event.preventDefault()
								console.log(event.target)
								const eventId = Sentry.captureMessage('User Feedback')
								const userFeedback = {
									event_id: eventId,
									...event.target,
								}
								Sentry.captureUserFeedback(userFeedback)
								setShowModal(false)
							}}
						>
							<Input type="text" placeholder="Name" value={user.name} />
							<Input type="email" placeholder="Email" value={user.email} />
							<Textarea placeholder="Enter your feedback" />
							<Button className="mt-4 max-w-md w-max" type="submit">
								Submit
							</Button>
						</Form>
					</div>,
					document.body,
				)}
			<Button
				className="gap-2"
				type="button"
				onClick={() => setShowModal(!showModal)}
			>
				<GrAnnounce />
				Feedback
			</Button>
		</>
	)
}
