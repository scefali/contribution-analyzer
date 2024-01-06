export class LLMRateLimitError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'LLMRateLimitError'
	}
}


export class BadRefreshTokenError extends Error {
	constructor() {
		super('BadRefreshTokenError')
		this.name = 'BadRefreshTokenError'
	}
}