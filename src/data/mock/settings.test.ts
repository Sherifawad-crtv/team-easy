import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGAL } from '../../config/legal'
import { LIMITS } from '../../config/limits'
import { track } from '../../analytics'
import { settings } from '../../state/settings'
import { mockApi } from './mockApi'
import { scenarioStore } from './scenario'

const code = async (p: Promise<unknown>) => {
  try { await p } catch (e) { return (e as { code?: string }).code }
}

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  await mockApi.auth.signIn('layla@acme.co', 'longpass1')
  for (const b of await mockApi.safety.blocked()) await mockApi.safety.unblock(b.id)
})

describe('privacy settings', () => {
  it('starts open, saves a choice and keeps it', async () => {
    expect((await mockApi.settings.privacy()).onlineStatus).toBe('everyone')
    await mockApi.settings.savePrivacy({ onlineStatus: 'nobody' })
    expect(await mockApi.settings.privacy()).toMatchObject({ onlineStatus: 'nobody', profilePhoto: 'everyone' })
  })

  it('refuses a wrong current password and accepts the right one', async () => {
    expect(await code(mockApi.settings.changePassword('wrongpass1', 'newpass123'))).toBe('invalid_credentials')
    await expect(mockApi.settings.changePassword('longpass1', 'newpass123')).resolves.toBeUndefined()
  })

  it('takes one data request and promises a date', async () => {
    expect(await mockApi.settings.exportStatus()).toBeNull()
    const r = await mockApi.settings.requestExport()
    expect(r.readyBy - r.requestedAt).toBe(LEGAL.exportDays * 24 * 60 * 60 * 1000)
    expect(await mockApi.settings.exportStatus()).toMatchObject({ readyBy: r.readyBy })
  })
})

describe('blocking and reporting', () => {
  const direct = async (id: string) => (await mockApi.chat.listConversations()).find((c) => c.id === id)!

  it('blocks and unblocks a person, and the direct chat follows', async () => {
    expect((await direct('c-omar')).blocked).toBeFalsy()
    await mockApi.safety.block('u-omar')
    expect((await direct('c-omar')).blocked).toBe(true)
    expect((await mockApi.safety.blocked()).map((b) => b.id)).toEqual(['u-omar'])
    await mockApi.safety.unblock('u-omar')
    expect((await direct('c-omar')).blocked).toBe(false)
    expect(await mockApi.safety.blocked()).toEqual([])
  })

  it('a report can block at the same time, and only when asked', async () => {
    await mockApi.safety.report({ target: { kind: 'person', userId: 'u-yuki' }, reason: 'spam' })
    expect(await mockApi.safety.blocked()).toEqual([])
    await mockApi.safety.report({ target: { kind: 'message', conversationId: 'c-product', messageId: 'm1', userId: 'u-priya' }, reason: 'harassment', block: true })
    expect((await mockApi.safety.blocked()).map((b) => b.id)).toEqual(['u-priya'])
    expect((await direct('c-priya')).blocked).toBe(true)
  })

  it('reporting a group never blocks anyone', async () => {
    await mockApi.safety.report({ target: { kind: 'group', groupId: 'g-product' }, reason: 'scam', block: true })
    expect(await mockApi.safety.blocked()).toEqual([])
  })
})

describe('legal documents', () => {
  it('serves terms, privacy policy, guidelines and licenses', async () => {
    for (const kind of ['terms', 'privacy', 'guidelines', 'licenses'] as const) {
      const d = await mockApi.legal.document(kind)
      expect(d.kind).toBe(kind)
      expect(d.sections.length).toBeGreaterThan(0)
    }
  })

  it('the privacy policy states the real retention times and the way to delete', async () => {
    const text = JSON.stringify(await mockApi.legal.document('privacy'))
    expect(text).toContain(`${LIMITS.attachmentRetentionDays.standard} days`)
    expect(text).toContain(`${LIMITS.archivedRetentionDays} days`)
    expect(text).toMatch(/delete your account/i)
  })

  it('credits the icon set as its license requires', async () => {
    expect(JSON.stringify(await mockApi.legal.document('licenses'))).toContain('480 Design')
  })
})

describe('deleting the account', () => {
  it('needs the password again, then forgets everything', async () => {
    expect(await code(mockApi.auth.deleteAccount(''))).toBe('invalid_credentials')
    expect(await code(mockApi.auth.deleteAccount('wrongpass1'))).toBe('invalid_credentials')
    await mockApi.settings.savePrivacy({ jobTitle: 'nobody' })
    await mockApi.auth.deleteAccount('longpass1')
    expect(await mockApi.auth.restoreSession()).toBeNull()
    expect((await mockApi.settings.privacy()).jobTitle).toBe('everyone')
  })
})

describe('usage data consent', () => {
  it('records nothing until the person agrees, then records', () => {
    const log = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    settings.setAnalytics(false)
    track('chat_opened')
    expect(log).not.toHaveBeenCalled()
    settings.setAnalytics(true)
    track('chat_opened')
    expect(log).toHaveBeenCalledTimes(1)
    settings.setAnalytics(false)
    log.mockRestore()
  })

  it('personalized ads and usage data both start off', () => {
    expect(settings.analytics()).toBe(false)
    expect(settings.personalizedAds()).toBe(false)
  })
})

describe('storage', () => {
  it('lists what each chat holds and frees one chat', async () => {
    const before = await mockApi.data.storage()
    expect(before.total).toBeGreaterThan(0)
    const first = before.chats[0]
    const after = await mockApi.data.clearChatMedia(first.conversationId)
    expect(after.total).toBe(before.total - first.bytes)
    expect(after.chats.find((c) => c.conversationId === first.conversationId)).toBeUndefined()
  })
})
