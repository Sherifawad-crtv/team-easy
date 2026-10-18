export type ApiErrorCode =
  | 'network'
  | 'unknown'
  | 'invalid_credentials'
  | 'email_taken'
  | 'invite_invalid'
  | 'invite_expired'

export class ApiError extends Error {
  code: ApiErrorCode
  constructor(code: ApiErrorCode) {
    super(code)
    this.name = 'ApiError'
    this.code = code
  }
}

export interface UserMessage {
  title: string
  body: string
  offline: boolean
}

/** What to tell the user when a call fails. Plain, specific, no blame. */
export function describeError(error: unknown): UserMessage {
  const code = error instanceof ApiError ? error.code : 'unknown'
  switch (code) {
    case 'network':
      return { title: "You're offline", body: 'Check your connection and try again.', offline: true }
    case 'invalid_credentials':
      return { title: "That email and password don't match", body: 'Check them and try again, or reset your password.', offline: false }
    case 'email_taken':
      return { title: 'That email already has an account', body: 'Sign in instead, or use a different email.', offline: false }
    case 'invite_invalid':
      return { title: "This invite isn't valid", body: 'Check the link or code, or ask your admin for a new one.', offline: false }
    case 'invite_expired':
      return { title: 'This invite has expired', body: 'Ask your admin to send a new one.', offline: false }
    default:
      return { title: 'Something went wrong on our side', body: 'Nothing was changed. Try again in a moment.', offline: false }
  }
}
