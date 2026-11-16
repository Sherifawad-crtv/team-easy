import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../errors'
import { mockApi, simulateCallTimeLeft, simulatePurchaseFailure } from './mockApi'
import { roleStore } from './role'
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

describe('mock groups', () => {
  const gid = async (name: string) => (await mockApi.groups.list()).groups.find((g) => g.name === name)!

  it('lists the tree and counts my groups', async () => {
    const tree = await mockApi.groups.list()
    expect(tree.groups.some((g) => g.level === 3)).toBe(true)
    expect(tree.myGroupCount).toBeGreaterThan(3)
  })

  it('enforces 5 sub-groups per parent', async () => {
    const eng = await gid('Engineering')
    expect(await code(mockApi.groups.create({ name: 'Sixth', parentId: eng.id }))).toBe('limit_children')
    const product = await gid('Product Team')
    expect(await code(mockApi.groups.create({ name: 'Brand', parentId: product.id }))).toBeNull()
    expect(await code(mockApi.groups.create({ name: 'Brand', parentId: product.id }))).toBe('name_taken')
  })

  it('refuses a fourth level', async () => {
    const api = (await gid('API'))
    expect(await code(mockApi.groups.create({ name: 'Deeper', parentId: api.id }))).toBe('limit_depth')
  })

  it('stops adding members at the 300 cap', async () => {
    const launch = await gid('Q4 Launch Working Group: cross-functional coordination and release planning')
    const people = await mockApi.groups.candidates(launch.id, '')
    expect(await code(mockApi.groups.addMembers(launch.id, people.slice(0, 5).map((p) => p.id)))).toBe('limit_members')
    expect(await code(mockApi.groups.addMembers(launch.id, people.slice(0, 2).map((p) => p.id)))).toBeNull()
  })

  it('lets only admins manage', async () => {
    roleStore.set('member')
    const product = await gid('Product Team')
    expect(await code(mockApi.groups.create({ name: 'Nope', parentId: product.id }))).toBe('not_allowed')
    expect(await code(mockApi.groups.remove(product.id))).toBe('not_allowed')
    expect(await code(mockApi.groups.setTitleTag('u-noor', 'Hi'))).toBe('not_allowed')
    roleStore.set('admin')
  })

  it('deletes with undo and restores the group', async () => {
    const product = await gid('Support rota')
    const del = await mockApi.groups.remove(product.id)
    expect((await mockApi.groups.list()).groups.some((g) => g.id === product.id)).toBe(false)
    await mockApi.groups.undoDelete(del.undoToken)
    expect((await mockApi.groups.list()).groups.some((g) => g.id === product.id)).toBe(true)
  })

  it('leaves in two ways', async () => {
    const research = await gid('Operations')
    await mockApi.groups.leave(research.id, 'keep')
    expect((await mockApi.groups.get(research.id)).left).toBe(true)
    const conv = await mockApi.groups.openChat(research.id)
    expect(await code(mockApi.chat.sendMessage(conv.id, { text: 'hi' }))).toBe('not_allowed')
    const fin = await gid('Finance close')
    await mockApi.groups.leave(fin.id, 'delete')
    expect((await mockApi.groups.list()).groups.some((g) => g.id === fin.id)).toBe(false)
  })

  it('joins through a link and rejects a bad one', async () => {
    roleStore.set('member')
    expect(await code(mockApi.groups.resolveLink('nope'))).toBe('link_invalid')
    const info = await mockApi.groups.resolveLink('G-g-guild')
    expect(info.path).toEqual(['Product Team'])
    expect(info.alreadyMember).toBe(false)
    await mockApi.groups.join('G-g-guild')
    expect((await mockApi.groups.list()).groups.some((g) => g.name === 'Design guild')).toBe(true)
    roleStore.set('admin')
  })

  it('shows title tags next to sender names in group chats', async () => {
    await mockApi.groups.setTitleTag('u-noor', 'Design lead')
    const msgs = await mockApi.chat.listMessages('c-product')
    expect(msgs.some((m) => m.senderId === 'u-noor' ? m.senderTitle === 'Design lead' : true)).toBe(true)
    await mockApi.groups.setTitleTag('u-noor', '')
  })
})

describe('mock calendar', () => {
  const DAY = 86_400_000
  it('gives members only their calendars and admins all of them', async () => {
    roleStore.set('member')
    const mine = await mockApi.calendar.calendars()
    expect(mine.every((c) => c.assigned)).toBe(true)
    expect(mine.some((c) => c.name === 'Support on-call')).toBe(false)
    roleStore.set('admin')
    expect((await mockApi.calendar.calendars()).some((c) => c.name === 'Support on-call')).toBe(true)
  })

  it('returns events in range and hides unassigned calendars from members', async () => {
    const from = Date.now()
    roleStore.set('admin')
    const all = await mockApi.calendar.events(from, from + 14 * DAY)
    expect(all.length).toBeGreaterThan(4)
    expect(all.some((e) => e.calendarId === 'cal-oncall')).toBe(true)
    roleStore.set('member')
    const some = await mockApi.calendar.events(from, from + 14 * DAY)
    expect(some.some((e) => e.calendarId === 'cal-oncall')).toBe(false)
    roleStore.set('admin')
  })

  it('lets only admins assign, and changes who has a calendar', async () => {
    roleStore.set('member')
    expect(await code(mockApi.calendar.assign('cal-oncall', ['u-sam']))).toBe('not_allowed')
    roleStore.set('admin')
    await mockApi.calendar.assign('cal-oncall', ['me', 'u-sam'])
    const cal = (await mockApi.calendar.calendars()).find((c) => c.id === 'cal-oncall')!
    expect(cal).toMatchObject({ assigned: true, assignedCount: 2 })
  })
})

describe('mock notifications and data', () => {
  it('saves settings, mutes groups and respects both when a message arrives', async () => {
    const got: string[] = []
    const off = mockApi.notifications.subscribe((p) => got.push(p.title))
    await mockApi.notifications.saveSettings({ groups: false })
    expect((await mockApi.notifications.settings()).groups).toBe(false)
    await mockApi.notifications.setGroupMuted('g-product', true)
    expect(await mockApi.notifications.mutedGroups()).toEqual(['g-product'])
    await mockApi.notifications.setGroupMuted('g-product', false)
    expect(await mockApi.notifications.mutedGroups()).toEqual([])
    off()
  })

  it('shows one banner and not again after it is dismissed', async () => {
    const [b] = await mockApi.notifications.banners()
    await mockApi.notifications.dismissBanner(b.id)
    expect((await mockApi.notifications.banners()).some((x) => x.id === b.id)).toBe(false)
  })

  it('reports shorter retention for personal and longer for work accounts', async () => {
    await mockApi.auth.signIn('a@b.co', 'longpass1')
    expect((await mockApi.data.retention()).attachmentDays).toBe(6)
    await mockApi.auth.switchIdentity('organization')
    expect(await mockApi.data.retention()).toMatchObject({ plan: 'business', attachmentDays: 15 })
  })

  it('lists files that will expire, soonest first, and backs up', async () => {
    const files = await mockApi.data.expiringFiles()
    expect(files.length).toBeGreaterThan(2)
    expect(files[0].expiresAt).toBeLessThanOrEqual(files[1].expiresAt)
    expect((await mockApi.data.backup()).lastBackupAt).toBeNull()
    expect((await mockApi.data.startBackup()).lastBackupAt).not.toBeNull()
    expect((await mockApi.data.transferCode()).code).toMatch(/^\d{6}$/)
  })

  it('marks an archived group with its deletion date', async () => {
    const offsite = (await mockApi.groups.list()).groups.find((g) => g.name === '2025 Offsite')!
    expect(offsite.deleteAt).toBeGreaterThan(Date.now())
  })
})

describe('mock calls', () => {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const events: import('../types').CallEvent[] = []
  let off = () => {}
  beforeEach(() => {
    events.length = 0
    off()
    off = mockApi.calls.subscribe((e) => events.push(e))
    simulateCallTimeLeft(null)
  })

  it('refuses announcement chats and the daily cap', async () => {
    expect(await code(mockApi.calls.start('c-general', 'audio'))).toBe('call_unavailable')
    simulateCallTimeLeft(0)
    expect(await code(mockApi.calls.start('c-omar', 'audio'))).toBe('call_cap_reached')
    expect((await mockApi.calls.usage()).usedSeconds).toBe(3600)
  })

  it('connects an online person, refuses a second call, and records the call', async () => {
    const call = await mockApi.calls.start('c-omar', 'video')
    expect(call.participants.map((p) => p.state)).toEqual(['connected', 'ringing'])
    expect(await code(mockApi.calls.start('c-priya', 'audio'))).toBe('call_active')
    await wait(2600)
    expect(events.some((e) => e.type === 'started')).toBe(true)
    const rec = await mockApi.calls.end(call.id)
    expect(rec).toMatchObject({ direction: 'outgoing', mode: 'video', title: 'Omar Al-Fayed' })
    expect((await mockApi.calls.history())[0].id).toBe(call.id)
  }, 15000)

  it('ends the call when someone who is away declines', async () => {
    await mockApi.calls.start('c-amelia', 'audio')
    await wait(4200)
    expect(events.find((e) => e.type === 'ended')).toMatchObject({ reason: 'declined' })
    expect((await mockApi.calls.history())[0].direction).toBe('missed')
  }, 15000)

  it('rings at most four others in a group call and ends a call that hits the cap', async () => {
    const call = await mockApi.calls.start('c-product', 'audio')
    expect(call.group).toBe(true)
    expect(call.participants.length).toBeLessThanOrEqual(5)
    await wait(2300)
    simulateCallTimeLeft(1)
    await wait(2300)
    expect(events.find((e) => e.type === 'ended')).toMatchObject({ reason: 'cap_reached' })
  }, 15000)
})

describe('mock purchases and ads', () => {
  beforeEach(() => { roleStore.set('admin') })

  it('starts on the free limits and raises them with each add-on', async () => {
    expect((await mockApi.purchases.entitlements())).toMatchObject({ plan: 'free', limits: { memberCap: 300, mainGroups: 5, subgroups: 5 } })
    await mockApi.purchases.purchase('members_100')
    await mockApi.purchases.purchase('subgroups_5')
    expect(await mockApi.purchases.entitlements()).toMatchObject({ plan: 'paid', limits: { memberCap: 400, subgroups: 10, subSubgroups: 10, mainGroups: 5 } })
  }, 15000)

  it('lets a full parent take more sub-groups once they are bought', async () => {
    const eng = (await mockApi.groups.list()).groups.find((g) => g.name === 'Engineering')!
    expect(await code(mockApi.groups.create({ name: 'Sixth', parentId: eng.id }))).toBe('limit_children')
    await mockApi.purchases.purchase('subgroups_5')
    expect(await code(mockApi.groups.create({ name: 'Sixth', parentId: eng.id }))).toBeNull()
    expect((await mockApi.groups.list()).limits.subgroups).toBe(10)
  }, 15000)

  it('lets a group past 300 once members are bought', async () => {
    const launch = (await mockApi.groups.list()).groups.find((g) => g.name.startsWith('Q4 Launch'))!
    const people = await mockApi.groups.candidates(launch.id, '')
    expect(await code(mockApi.groups.addMembers(launch.id, people.slice(0, 6).map((p) => p.id)))).toBe('limit_members')
    await mockApi.purchases.purchase('members_100')
    expect(await code(mockApi.groups.addMembers(launch.id, people.slice(0, 6).map((p) => p.id)))).toBeNull()
  }, 15000)

  it('refuses members, fails on demand, cancels to the end of the period and restores', async () => {
    roleStore.set('member')
    expect(await code(mockApi.purchases.purchase('members_100'))).toBe('not_allowed')
    roleStore.set('admin')
    simulatePurchaseFailure(true)
    expect(await code(mockApi.purchases.purchase('members_100'))).toBe('purchase_failed')
    expect((await mockApi.purchases.entitlements()).plan).toBe('free')
    await mockApi.purchases.purchase('members_100')
    await mockApi.purchases.cancel('members_100')
    const owned = (await mockApi.purchases.offerings()).find((p) => p.id === 'members_100')!.owned!
    expect(owned.endsAt).toBe(owned.renewsAt)
    expect((await mockApi.purchases.entitlements()).limits.memberCap).toBe(400)
    expect((await mockApi.purchases.restore()).plan).toBe('paid')
  }, 20000)

  it('shows ads only on the free plan outside the organization', async () => {
    await mockApi.auth.signIn('a@b.co', 'longpass1')
    expect(await mockApi.ads.forSlot('chat_list')).not.toBeNull()
    await mockApi.auth.switchIdentity('organization')
    expect(await mockApi.ads.forSlot('chat_list')).toBeNull()
    await mockApi.auth.switchIdentity('individual')
    await mockApi.purchases.purchase('subgroups_5')
    expect(await mockApi.ads.forSlot('conversation')).toBeNull()
  }, 15000)
})

describe('mock admin console', () => {
  beforeEach(() => { roleStore.set('admin') })

  it('is for admins only', async () => {
    roleStore.set('member')
    expect(await code(mockApi.admin.overview())).toBe('not_allowed')
    expect(await code(mockApi.admin.createInvite({ days: 7 }))).toBe('not_allowed')
  })

  it('shows headroom and who is nearly full', async () => {
    const o = await mockApi.admin.overview()
    expect(o.mainGroups).toBe(5)
    expect(o.nearCap.some((g) => g.name.startsWith('Q4 Launch'))).toBe(true)
  })

  it('adds a member who can then be found everywhere, and removes them again', async () => {
    const m = await mockApi.admin.addMember({ name: 'Rania Saleh', email: 'rania@acme.example', jobTitle: 'Designer' })
    expect(m.status).toBe('pending')
    expect(await code(mockApi.admin.addMember({ name: 'Rania Two', email: 'RANIA@acme.example' }))).toBe('member_exists')
    expect((await mockApi.chat.searchMembers('Rania')).length).toBe(1)
    expect((await mockApi.admin.overview()).pendingMembers).toBe(1)
    await mockApi.admin.removeMember(m.id)
    expect((await mockApi.chat.searchMembers('Rania')).length).toBe(0)
    expect((await mockApi.admin.members('')).some((x) => x.id === m.id)).toBe(false)
  })

  it('makes invites that the invite page accepts, until they are revoked or used', async () => {
    const open = await mockApi.admin.createInvite({ days: 7 })
    expect(open.link).toContain(`/invite/${open.code}`)
    expect((await mockApi.auth.resolveInvite(open.link)).organization.name).toBe('Acme Studio')
    await mockApi.admin.revokeInvite(open.code)
    expect(await code(mockApi.auth.resolveInvite(open.code))).toBe('invite_invalid')

    const one = await mockApi.admin.createInvite({ email: 'sara@x.co', days: 30 })
    await mockApi.auth.signUp({ name: 'Sara', email: 'sara@x.co', password: 'longpass1', inviteToken: one.code })
    expect(await code(mockApi.auth.resolveInvite(one.code))).toBe('invite_invalid')
    expect((await mockApi.admin.invites()).find((i) => i.code === one.code)).toMatchObject({ status: 'used', uses: 1 })
    expect(await code(mockApi.auth.resolveInvite('ORG-OLD'))).toBe('invite_expired')
  })

  it('creates a calendar and a one-off event that members then see, and deletes it', async () => {
    const cal = await mockApi.calendar.createCalendar({ name: 'Offsite 2027', description: 'Planning', tone: 3 })
    expect(await code(mockApi.calendar.createCalendar({ name: 'offsite 2027', description: '', tone: 1 }))).toBe('name_taken')
    const start = Date.now() + 3 * 86_400_000
    const ev = await mockApi.calendar.createEvent({ calendarId: cal.id, title: 'Kick-off', start, end: start + 3_600_000, allDay: false })
    expect((await mockApi.calendar.events(start - 1000, start + 10_000_000)).some((e) => e.id === ev.id && e.oneOff)).toBe(true)
    await mockApi.calendar.deleteEvent(ev.id)
    expect((await mockApi.calendar.events(start - 1000, start + 10_000_000)).some((e) => e.id === ev.id)).toBe(false)
  })
})

describe('mock chat row actions', () => {
  it('flags a chat as unread until it is read, and keeps the count at zero', async () => {
    await mockApi.chat.markUnread('c-priya')
    let row = (await mockApi.chat.listConversations()).find((c) => c.id === 'c-priya')!
    expect(row).toMatchObject({ flaggedUnread: true, unread: 0 })
    await mockApi.chat.markRead('c-priya')
    row = (await mockApi.chat.listConversations()).find((c) => c.id === 'c-priya')!
    expect(row.flaggedUnread).toBe(false)
  })

  it('mutes a direct chat, and a group chat together with its group', async () => {
    await mockApi.chat.setMuted('c-priya', true)
    await mockApi.chat.setMuted('c-product', true)
    const rows = await mockApi.chat.listConversations()
    expect(rows.find((c) => c.id === 'c-priya')!.muted).toBe(true)
    expect(rows.find((c) => c.id === 'c-product')!.muted).toBe(true)
    expect(await mockApi.notifications.mutedGroups()).toContain('g-product')
    await mockApi.chat.setMuted('c-product', false)
    expect(await mockApi.notifications.mutedGroups()).not.toContain('g-product')
  })
})
