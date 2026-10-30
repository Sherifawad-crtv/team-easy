import type {
  Account,
  BackupStatus,
  CallEvent,
  CallMode,
  CallRecord,
  CallSession,
  CallUsage,
  CalendarAssignee,
  CalendarEvent,
  CalendarInfo,
  ChatEvent,
  Conversation,
  DeletedGroup,
  Group,
  GroupLinkInfo,
  GroupMember,
  GroupTree,
  LeaveMode,
  NewGroup,
  IdentityKind,
  Member,
  Message,
  MessageDraft,
  OrgInvite,
  PermissionKind,
  PermissionStatus,
  ExpiringFile,
  NotificationSettings,
  ProfilePatch,
  PushNotification,
  RetentionInfo,
  TransferCode,
  UpdateItem,
  SearchFilters,
  SearchResults,
  SignUpData,
} from './types'

// The contract every backend must satisfy. Screens only ever talk to this.
// Methods reject with ApiError. Realtime comes through `subscribe`.

export interface AuthApi {
  restoreSession(): Promise<Account | null>
  signUp(data: SignUpData): Promise<Account>
  signIn(email: string, password: string): Promise<Account>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resolveInvite(linkOrCode: string): Promise<OrgInvite>
  switchIdentity(kind: IdentityKind): Promise<Account>
  deleteAccount(): Promise<void>
}

export interface ChatApi {
  listConversations(): Promise<Conversation[]>
  listMessages(conversationId: string): Promise<Message[]>
  /** Text, an image or a document. Rejects on failure so the UI can retry. */
  sendMessage(conversationId: string, draft: MessageDraft): Promise<Message>
  /** Only allowed in direct (private) chats, CHT-05. */
  deleteMessage(conversationId: string, messageId: string): Promise<void>
  markRead(conversationId: string): Promise<void>
  searchMembers(query: string): Promise<Member[]>
  /** SRC-02..04: chats, message text and document names, with filters. */
  search(query: string, filters: SearchFilters): Promise<SearchResults>
  openDirect(memberId: string): Promise<Conversation>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

export interface ProfileApi {
  updateProfile(patch: ProfilePatch): Promise<Account>
}

export interface PermissionsApi {
  status(kind: PermissionKind): Promise<PermissionStatus>
  /** Asks the OS. The UI shows its own rationale first. */
  request(kind: PermissionKind): Promise<PermissionStatus>
  /** Review tool only: forget the answer. */
  reset(kind: PermissionKind): Promise<void>
}

export interface GroupApi {
  /** Every group the user can see, flat. The client builds the tree. */
  list(): Promise<GroupTree>
  get(id: string): Promise<Group>
  /** GRP-01, 02, 08: admin only. Rejects past the 5/5/5 hierarchy or the per-user limit. */
  create(data: NewGroup): Promise<Group>
  /** GRP-11 */
  archive(id: string, archived: boolean): Promise<Group>
  /** GRP-09, 10: admin only. The group can be brought back with `undoDelete` for a short window. */
  remove(id: string): Promise<DeletedGroup>
  undoDelete(undoToken: string): Promise<Group>
  /** Opens (creating if needed) the group's chat. */
  openChat(id: string): Promise<Conversation>
  members(id: string): Promise<GroupMember[]>
  /** ROL-01: admin adds people directly. Rejects past the member cap. */
  addMembers(id: string, memberIds: string[]): Promise<void>
  /** Members not in the group yet, for the add sheet. */
  candidates(id: string, query: string): Promise<Member[]>
  /** ROL-03: admin only. */
  setBlocked(id: string, memberId: string, blocked: boolean): Promise<void>
  /** ROL-04: admin only. An empty tag clears it. */
  setTitleTag(memberId: string, tag: string): Promise<void>
  /** ROL-05, 06 */
  leave(id: string, mode: LeaveMode): Promise<void>
  /** GRP-06, ROL-01, ROL-02: admins and members can both create a link. */
  createLink(id: string): Promise<{ url: string; token: string }>
  resolveLink(token: string): Promise<GroupLinkInfo>
  join(token: string): Promise<Group>
}

export interface CalendarApi {
  /** CAL-01, 02: members get the calendars assigned to them, admins get all of them. */
  calendars(): Promise<CalendarInfo[]>
  /** Events of the visible calendars between two times (ms). */
  events(from: number, to: number): Promise<CalendarEvent[]>
  /** Admin only: everyone, with whether the calendar is assigned to them. */
  assignees(calendarId: string): Promise<CalendarAssignee[]>
  /** CAL-02: admin only. Sets exactly who has this calendar. */
  assign(calendarId: string, memberIds: string[]): Promise<void>
}

export interface NotificationsApi {
  /** NTF-01: updates to show as a banner, not dismissed yet. */
  banners(): Promise<UpdateItem[]>
  dismissBanner(id: string): Promise<void>
  /** NTF-01, NTF-03: the log of releases, updates and offers, newest first. */
  updates(): Promise<UpdateItem[]>
  update(id: string): Promise<UpdateItem>
  /** NTF-02 */
  settings(): Promise<NotificationSettings>
  saveSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings>
  mutedGroups(): Promise<string[]>
  setGroupMuted(groupId: string, muted: boolean): Promise<void>
  /** Pushes that arrive while the app is open. The OS delivers them when it is closed. */
  subscribe(listener: (push: PushNotification) => void): () => void
}

export interface DataApi {
  retention(): Promise<RetentionInfo>
  /** DAT-02: files that will be deleted soon if nobody opens them. */
  expiringFiles(): Promise<ExpiringFile[]>
  backup(): Promise<BackupStatus>
  startBackup(): Promise<BackupStatus>
  /** DAT-01 (assumed meaning): a short code that moves chats to a new phone. */
  transferCode(): Promise<TransferCode>
}

export interface CallsApi {
  /** CLL-05: today's calling time against the daily cap. */
  usage(): Promise<CallUsage>
  /** CLL-01..04: start an audio or video call in a chat. Rejects past the daily cap or when the call is full. */
  start(conversationId: string, mode: CallMode): Promise<CallSession>
  answer(callId: string): Promise<CallSession>
  decline(callId: string): Promise<void>
  /** Hang up. Returns the record, with how long it lasted. */
  end(callId: string): Promise<CallRecord>
  history(): Promise<CallRecord[]>
  /** Call state changes: incoming calls, people joining and leaving, the call ending. */
  subscribe(listener: (event: CallEvent) => void): () => void
}

export interface Api {
  auth: AuthApi
  chat: ChatApi
  profile: ProfileApi
  groups: GroupApi
  calendar: CalendarApi
  notifications: NotificationsApi
  data: DataApi
  calls: CallsApi
  permissions: PermissionsApi
}
