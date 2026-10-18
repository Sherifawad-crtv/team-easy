import type {
  Account,
  ChatEvent,
  Conversation,
  IdentityKind,
  Member,
  Message,
  OrgInvite,
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
  sendMessage(conversationId: string, text: string): Promise<Message>
  /** Only allowed in direct (private) chats, CHT-05. */
  deleteMessage(conversationId: string, messageId: string): Promise<void>
  markRead(conversationId: string): Promise<void>
  searchMembers(query: string): Promise<Member[]>
  openDirect(memberId: string): Promise<Conversation>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

export interface Api {
  auth: AuthApi
  chat: ChatApi
}
