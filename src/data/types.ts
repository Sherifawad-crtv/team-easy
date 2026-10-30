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
  /** ROL-05: the user left but kept the group in the list. Read only. */
  left?: boolean
  /** The group this chat belongs to, for group chats. */
  groupId?: string
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
  /** When the server deletes it if nobody opens it (DAT-02). */
  expiresAt?: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  /** Text, or the caption when there is an attachment. May be empty. */
  text: string
  attachment?: Attachment
  /** Title tag of the sender, in group chats. */
  senderTitle?: string
  at: number
  status: MessageStatus
}

export interface Member {
  id: string
  name: string
  jobTitle?: string
  /** ROL-04: a short tag an admin gives the person, shown next to their name. */
  titleTag?: string
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

export type PermissionKind = 'photos' | 'notifications'
export type PermissionStatus = 'unknown' | 'granted' | 'denied'

export interface ProfilePatch {
  name?: string
  email?: string
  jobTitle?: string
  /** `null` removes the photo. */
  photoUrl?: string | null
}

// ---- Groups (GRP-*, ROL-*) ----

export type Role = 'admin' | 'member'
/** 1 = group, 2 = sub-group, 3 = sub-sub-group. */
export type GroupLevel = 1 | 2 | 3

export interface Group {
  id: string
  name: string
  parentId: string | null
  level: GroupLevel
  memberCount: number
  /** Members of the main group above this one, counting all its sub-groups (PRD §16).
   *  This is what the 300 cap applies to. Equals `memberCount` for a main group. */
  rootMemberCount: number
  myRole: Role
  archived: boolean
  /** DAT-04: when an archived group is deleted automatically. Set by the server. */
  deleteAt?: number
  /** ROL-05: the user left but kept the group in the list. */
  left: boolean
  unread: number
}

export interface GroupMember {
  id: string
  name: string
  jobTitle?: string
  titleTag?: string
  role: Role
  /** ROL-03: a blocked member stays listed but cannot post or receive new messages. */
  blocked: boolean
  presence: Presence
  isMe: boolean
}

export interface GroupTree {
  groups: Group[]
  /** How many groups the signed-in user belongs to, against the per-user limit. */
  myGroupCount: number
}

export interface NewGroup {
  name: string
  parentId: string | null
}

export interface DeletedGroup {
  /** Pass to `undoDelete` within the undo window. */
  undoToken: string
  name: string
}

export type LeaveMode = 'keep' | 'delete'

export interface GroupLinkInfo {
  token: string
  groupId: string
  groupName: string
  /** Path of parent groups, outermost first. */
  path: string[]
  memberCount: number
  invitedBy: string
  alreadyMember: boolean
}

// ---- Calendar (CAL-*) ----

export interface CalendarInfo {
  id: string
  name: string
  description: string
  /** Colour tone 0 to 4, the same palette as avatars. */
  tone: number
  /** Is this calendar assigned to me? Admins also see calendars that are not. */
  assigned: boolean
  assignedCount: number
}

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  start: number
  end: number
  allDay: boolean
  location?: string
  description?: string
}

export interface CalendarAssignee {
  id: string
  name: string
  jobTitle?: string
  assigned: boolean
}

// ---- Notifications (NTF-*) ----

export type UpdateKind = 'release' | 'update' | 'offer'

export interface UpdateItem {
  id: string
  kind: UpdateKind
  title: string
  summary: string
  body: string[]
  at: number
}

export interface NotificationSettings {
  messages: boolean
  groups: boolean
  updates: boolean
  offers: boolean
}

export interface PushNotification {
  id: string
  title: string
  body: string
  at: number
  /** Where tapping it goes (NTF-03). */
  target: { type: 'chat'; conversationId: string; messageId?: string } | { type: 'update'; updateId: string }
}

// ---- Data and storage (DAT-*) ----

export interface RetentionInfo {
  plan: 'standard' | 'business'
  /** DAT-02: days before an unopened attachment is deleted. */
  attachmentDays: number
  /** DAT-04: days before an archived group is deleted. A database value. */
  archivedDays: number
}

export interface ExpiringFile {
  conversationId: string
  conversationTitle: string
  messageId: string
  name: string
  kind: AttachmentKind
  size: number
  expiresAt: number
}

export interface BackupStatus {
  lastBackupAt: number | null
  sizeBytes: number | null
}

export interface TransferCode {
  code: string
  expiresAt: number
}
