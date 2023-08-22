import {
	Body,
	Container,
	Head,
	Html,
	Link,
	Preview,
	Section,
	Text,
	Heading,
} from '@react-email/components'
import { type TeamMember } from '~/utils/types.tsx'

import Github from '~/images/github.tsx'

interface TeamSummaryProps {
	teamMembers: TeamMember[]
	summaryList: string[]
}

export const TeamSummary = ({ teamMembers, summaryList }: TeamSummaryProps) => (
	<Html>
		<Head />
		<Preview>A summary of your team's contributions this past week</Preview>
		<Body style={main}>
			<Container style={container}>
				<Github />
				{teamMembers.map((member, index) => {
					const summary = summaryList[index]
					const chunks = summary.split('\n').map(chunk => chunk.trim())
					return (
						<Section key={index}>
							<Link href={`https://github.com/${member.gitHubUserName}`}>
								<Heading>{member.name}</Heading>
							</Link>
							{chunks.map((chunk, index) => {
								if (!chunk) {
									return null
								}
								return (
									<Text key={index}>
										{chunk}
										<br />
									</Text>
								)
							})}
						</Section>
					)
				})}
			</Container>
		</Body>
	</Html>
)

export default TeamSummary

const main = {
	backgroundColor: '#ffffff',
	color: '#24292e',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
}

const container = {
	width: '680px',
	margin: '0 auto',
	padding: '20px 0 48px',
}
