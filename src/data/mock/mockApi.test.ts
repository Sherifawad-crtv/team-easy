import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../errors'
import { mockApi } from './mockApi'
import { scenarioStore } from './scenario'

const code = async (p: Promise<unknown>) => p.then(() => null, (e: unknown) => (e instanceof ApiError ? e.code : 'other'))

beforeEach(() => {
  localStorage.clear()
  scenarioStore.set('normal')
})

describe('mock auth', () => {
  it('rejects a wrong password and an already-used email', async () => {
    expect(await code(mockApi.auth.signIn('a@b.co', 'wrongpass1'))).toBe('invalid_credentials')
    expect(await code(mockApi.auth.signUp({ name: 'Sam', email: 'taken@x.co', password: 'longpass1' }))).toBe('email_taken')
  })

  it('attaches the organization when signing up with a valid invite', async () => {
    const a = await mockApi.auth.signUp({ name: 'Sam', email: 'sam@x.co', password: 'longpass1', inviteToken: 'org-acme' })
    expect(a.organization?.name).toBe('Acme Studio')
    expect(a.activeIdentity).toBe('organization')
  })

  it('tells expired from invalid invites', async () => {
    expect(await code(mockApi.auth.resolveInvite('ORG-OLD'))).toBe('invite_expired')
    expect(await code(mockApi.auth.resolveInvite('https://x.co/invite/nope'))).toBe('invite_invalid')
  })

  it('follows the offline scenario', async () => {
    scenarioStore.set('offline')
    expect(await code(mockApi.auth.requestPasswordReset('a@b.co'))).toBe('network')
  })
})

describe('mock chat', () => {
  it('lists conversations newest first and none in the empty scenario', async () => {
    const list = await mockApi.chat.listConversations()
    expect(list.length).toBeGreaterThan(8)
    expect([...list].sort((a, b) => b.lastAt - a.lastAt).map((c) => c.id)).toEqual(list.map((c) => c.id))
    scenarioStore.set('empty')
    expect(await mockApi.chat.listConversations()).toEqual([])
  })

  it('sends a message and fails when asked to', async () => {
    const m = await mockApi.chat.sendMessage('c-sam', 'hello')
    expect(m.status).toBe('sent')
    expect(await code(mockApi.chat.sendMessage('c-sam', 'nope #fail'))).toBe('unknown')
  })

  it('allows deleting own messages in private chats only (CHT-05)', async () => {
    const direct = await mockApi.chat.sendMessage('c-sam', 'delete me')
    await expect(mockApi.chat.deleteMessage('c-sam', direct.id)).resolves.toBeUndefined()
    const group = await mockApi.chat.sendMessage('c-product', 'stays')
    expect(await code(mockApi.chat.deleteMessage('c-product', group.id))).toBe('unknown')
  })

  it('finds people by name and reuses an existing direct chat', async () => {
    const found = await mockApi.chat.searchMembers('omar')
    expect(found.map((m) => m.name)).toContain('Omar Al-Fayed')
    const conv = await mockApi.chat.openDirect('u-omar')
    expect(conv.id).toBe('c-omar')
  })
})
