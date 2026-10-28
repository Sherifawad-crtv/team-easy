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
    const m = await mockApi.chat.sendMessage('c-sam', { text: 'hello' })
    expect(m.status).toBe('sent')
    expect(await code(mockApi.chat.sendMessage('c-sam', { text: 'nope #fail' }))).toBe('unknown')
  })

  it('allows deleting own messages in private chats only (CHT-05)', async () => {
    const direct = await mockApi.chat.sendMessage('c-sam', { text: 'delete me' })
    await expect(mockApi.chat.deleteMessage('c-sam', direct.id)).resolves.toBeUndefined()
    const group = await mockApi.chat.sendMessage('c-product', { text: 'stays' })
    expect(await code(mockApi.chat.deleteMessage('c-product', group.id))).toBe('unknown')
  })

  it('finds people by name and reuses an existing direct chat', async () => {
    const found = await mockApi.chat.searchMembers('omar')
    expect(found.map((m) => m.name)).toContain('Omar Al-Fayed')
    const conv = await mockApi.chat.openDirect('u-omar')
    expect(conv.id).toBe('c-omar')
  })
})

describe('mock media, search, profile, permissions', () => {
  it('sends an image and a document as attachments (MED-01..03)', async () => {
    const img = await mockApi.chat.sendMessage('c-sam', { text: 'look', file: new File(['x'], 'cat.png', { type: 'image/png' }) })
    expect(img.attachment).toMatchObject({ kind: 'image', name: 'cat.png' })
    const doc = await mockApi.chat.sendMessage('c-product', { text: '', file: new File(['x'], 'plan.pdf', { type: 'application/pdf' }) })
    expect(doc.attachment?.kind).toBe('document')
  })

  it('finds documents by name and messages by text (SRC-02, SRC-03)', async () => {
    const r = await mockApi.chat.search('roadmap', { date: 'any', type: 'all' })
    expect(r.documents.map((h) => h.message.attachment?.name)).toContain('Q4-roadmap.pdf')
    expect(r.messages.length).toBeGreaterThan(0)
  })

  it('filters by type, chat and date (SRC-04)', async () => {
    const docsOnly = await mockApi.chat.search('roadmap', { date: 'any', type: 'documents' })
    expect(docsOnly.messages).toHaveLength(0)
    expect(docsOnly.documents.length).toBeGreaterThan(0)
    const imagesOnly = await mockApi.chat.search('roadmap', { date: 'any', type: 'images' })
    expect(imagesOnly.documents).toHaveLength(0)
    const elsewhere = await mockApi.chat.search('roadmap', { date: 'any', type: 'all', conversationId: 'c-omar' })
    expect(elsewhere.documents).toHaveLength(0)
    // c-sam's last message is days old, so nothing in it counts as "today"
    const old = await mockApi.chat.search('invite flow notes', { date: 'any', type: 'all', conversationId: 'c-sam' })
    expect(old.messages.length).toBeGreaterThan(0)
    const today = await mockApi.chat.search('invite flow notes', { date: 'today', type: 'all', conversationId: 'c-sam' })
    expect(today.messages).toHaveLength(0)
  })

  it('updates the profile and rejects a taken email (PRF-01)', async () => {
    await mockApi.auth.signIn('a@b.co', 'longpass1')
    const updated = await mockApi.profile.updateProfile({ name: 'New Name', jobTitle: 'Lead' })
    expect(updated).toMatchObject({ name: 'New Name', jobTitle: 'Lead' })
    expect(await code(mockApi.profile.updateProfile({ email: 'taken@x.co' }))).toBe('email_taken')
  })

  it('remembers the photo permission answer (NFR-04)', async () => {
    expect(await mockApi.permissions.status('photos')).toBe('unknown')
    expect(await mockApi.permissions.request('photos')).toBe('granted')
    expect(await mockApi.permissions.status('photos')).toBe('granted')
    await mockApi.permissions.reset('photos')
    expect(await mockApi.permissions.status('photos')).toBe('unknown')
  })
})
