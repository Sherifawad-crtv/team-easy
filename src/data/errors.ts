export type ApiErrorCode =
  | 'network'
  | 'unknown'
  | 'invalid_credentials'
  | 'email_taken'
  | 'invite_invalid'
  | 'invite_expired'
  | 'limit_children'
  | 'limit_depth'
  | 'limit_user_groups'
  | 'limit_members'
  | 'not_allowed'
  | 'undo_expired'
  | 'link_invalid'
  | 'name_taken'
  | 'call_cap_reached'
  | 'call_full'
  | 'call_active'
  | 'call_unavailable'

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
    case 'limit_children':
      return { title: 'This is full', body: 'A group can hold up to 5 sub-groups, and a sub-group up to 5 more. Archive or delete one to make room.', offline: false }
    case 'limit_depth':
      return { title: "Groups can't go any deeper", body: 'Groups nest three levels: group, sub-group and sub-sub-group.', offline: false }
    case 'limit_user_groups':
      return { title: "You're in the maximum number of groups", body: 'Leave a group you no longer use, then try again.', offline: false }
    case 'limit_members':
      return { title: 'This group is full', body: 'It has reached the member limit. Adding more people needs a paid plan.', offline: false }
    case 'not_allowed':
      return { title: "You can't do that here", body: 'Only an admin can. Ask one to help.', offline: false }
    case 'undo_expired':
      return { title: 'Too late to undo', body: 'The group was deleted for good.', offline: false }
    case 'link_invalid':
      return { title: "This link isn't valid", body: 'It may have been turned off. Ask for a new one.', offline: false }
    case 'name_taken':
      return { title: 'That name is already used here', body: 'Pick a different name for this group.', offline: false }
    case 'call_cap_reached':
      return { title: "You've used today's calling time", body: 'Calls are limited to 1 hour a day. Your time starts again at midnight.', offline: false }
    case 'call_full':
      return { title: 'This call is full', body: 'A call holds up to 5 people.', offline: false }
    case 'call_active':
      return { title: "You're already in a call", body: 'Hang up first, then start a new one.', offline: false }
    case 'call_unavailable':
      return { title: "Can't call here", body: "This chat can't be called.", offline: false }
    default:
      return { title: 'Something went wrong on our side', body: 'Nothing was changed. Try again in a moment.', offline: false }
  }
}
