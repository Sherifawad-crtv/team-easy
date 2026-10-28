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
  /** Small resized photo as a data URL. */
  photoUrl?: string
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
  photoUrl?: string
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

export type AttachmentKind = 'image' | 'document'

export interface Attachment {
  kind: AttachmentKind
  name: string
  size: number
  mime: string
  /** Where the file can be shown or opened. Missing for demo documents. */
  url?: string
  /** Deleted by the retention rule (DAT-02). */
  expired?: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  /** Text, or the caption when there is an attachment. May be empty. */
  text: string
  attachment?: Attachment
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

/** What the client hands to the API when sending. The API turns the file into an Attachment. */
export interface MessageDraft {
  text: string
  file?: File
}

export type SearchDate = 'any' | 'today' | 'week' | 'month'
export type SearchType = 'all' | 'images' | 'documents'

export interface SearchFilters {
  date: SearchDate
  type: SearchType
  /** Limit the search to one conversation. */
  conversationId?: string
}

export interface MessageHit {
  message: Message
  conversation: Conversation
}

export interface SearchResults {
  chats: Conversation[]
  messages: MessageHit[]
  documents: MessageHit[]
}

export type PermissionKind = 'photos'
export type PermissionStatus = 'unknown' | 'granted' | 'denied'

export interface ProfilePatch {
  name?: string
  email?: string
  jobTitle?: string
  /** `null` removes the photo. */
  photoUrl?: string | null
}
