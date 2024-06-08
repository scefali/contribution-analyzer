import {
	Body,
	Container,
	Head,
	Html,
	Link,
	Preview,
	Section,
	Heading,
} from '@react-email/components'
import { Markdown } from '@react-email/markdown'
import Github from '#app/images/github.tsx'
import { type ProcessedPrData, type TeamMember } from '#app/utils/types.tsx'


interface TeamSummaryProps {
	teamMembers: TeamMember[]
	summaryList: ProcessedPrData[][]
}

export const TeamSummary = ({ teamMembers, summaryList }: TeamSummaryProps) => (
	<Html>
		<Head />
		<Preview>A summary of your team's contributions this past week</Preview>
		<Body style={main}>
			<Container style={container}>
				<Github />
				{teamMembers.map((member, index) => {
					const prList = summaryList[index]
					return (
						<Section key={index}>
							<Link href={`https://github.com/${member.gitHubUserName}`}>
								<Heading>{member.name}</Heading>
							</Link>
							{prList.map((pr, index) => (
								<Markdown key={index}>{pr.summary}</Markdown>
							))}
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
