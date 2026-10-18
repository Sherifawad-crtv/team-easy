// Domain types. These mirror what the backend will return, so replacing the
// mock with the real API changes no screen. Money-like values never appear
// here: anything computed is computed by the backend.

export type IdentityKind = 'individual' | 'organization'

export interface Organization {
  id: string
  name: string
}

export interface Account {
  id: string
  name: string
  email: string
  jobTitle?: string
  hasPhoto?: boolean
  organization?: Organization
  activeIdentity: IdentityKind
}

export interface OrgInvite {
  token: string
  organization: Organization
  invitedBy: string
}

export interface SignUpData {
  name: string
  email: string
  password: string
  jobTitle?: string
  hasPhoto?: boolean
  inviteToken?: string
}

export type ConversationKind = 'direct' | 'group' | 'general' | 'subgroup'
export type Presence = 'online' | 'away' | 'offline'

export interface Conversation {
  id: string
  kind: ConversationKind
  title: string
  /** Parent group name for sub-groups. */
  parent?: string
  memberCount?: number
  lastMessage: string
  lastSender?: string
  lastAt: number
  unread: number
  presence?: Presence
}

export type MessageStatus = 'sent' | 'sending' | 'failed'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  text: string
  at: number
  status: MessageStatus
}

export interface Member {
  id: string
  name: string
  jobTitle?: string
  presence: Presence
}

export type ChatEvent =
  | { type: 'message'; message: Message }
  | { type: 'conversation'; conversation: Conversation }
