import { describe, expect, it } from 'vitest'
import { mediaState } from './mediaState'

const base = { mine: false, expired: false, cached: false, policy: 'wifi', connection: 'wifi' } as const

describe('mediaState (MED-05, DAT-03)', () => {
  it('shows my own files and already opened files', () => {
    expect(mediaState({ ...base, policy: 'manual', mine: true })).toBe('ready')
    expect(mediaState({ ...base, policy: 'manual', cached: true })).toBe('ready')
  })
  it('auto always shows, manual always waits', () => {
    expect(mediaState({ ...base, policy: 'auto', connection: 'cellular' })).toBe('ready')
    expect(mediaState({ ...base, policy: 'manual' })).toBe('needs-download')
  })
  it('Wi-Fi only waits on mobile data', () => {
    expect(mediaState(base)).toBe('ready')
    expect(mediaState({ ...base, connection: 'cellular' })).toBe('needs-download')
  })
  it('expired files are gone whatever the setting', () => {
    expect(mediaState({ ...base, expired: true, mine: true, policy: 'auto' })).toBe('expired')
  })
})
