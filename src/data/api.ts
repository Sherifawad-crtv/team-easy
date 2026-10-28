import type {
  Account,
  ChatEvent,
  Conversation,
  IdentityKind,
  Member,
  Message,
  MessageDraft,
  OrgInvite,
  PermissionKind,
  PermissionStatus,
  ProfilePatch,
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

export interface Api {
  auth: AuthApi
  chat: ChatApi
  profile: ProfileApi
  permissions: PermissionsApi
}
