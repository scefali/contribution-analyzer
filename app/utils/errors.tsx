export class LLMRateLimitError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'LLMRateLimitError'
	}
}
