import { describe, expect, it } from 'vitest'
import { summarize, type TrackedEvent } from './summary'

let n = 0
const ev = (visitor: string, event: string, variant: 'A' | 'B', props: Record<string, unknown> = {}, forced = false): TrackedEvent => ({
  id: String(n++), at: n, visitor_id: visitor, session_id: 's', event, forced, props,
  variants: { chat_list: variant, conversation: 'A', group_nav: variant },
})

describe('summarize', () => {
  it('counts distinct visitors and rolls up per variant', () => {
    const rows = summarize([
      ev('v1', 'exposure', 'A'),
      ev('v1', 'chat_opened', 'A', { first: true, ms_since_list: 2000 }),
      ev('v1', 'chat_opened', 'A', { first: false, ms_since_list: 9000 }),
      ev('v1', 'message_sent', 'A'),
      ev('v2', 'exposure', 'B'),
      ev('v2', 'chat_opened', 'B', { first: true, ms_since_list: 1000 }),
      ev('v3', 'exposure', 'B'),
      ev('v3', 'chat_opened', 'B', { first: true, ms_since_list: 3000 }),
    ])
    const a = rows.find((r) => r.experiment === 'chat_list' && r.variant === 'A')!
    const b = rows.find((r) => r.experiment === 'chat_list' && r.variant === 'B')!
    expect(a).toMatchObject({ visitors: 1, opens: 2, messages: 1, avgMsToFirstOpen: 2000 })
    expect(b).toMatchObject({ visitors: 2, opens: 2, messages: 0, avgMsToFirstOpen: 2000 })
  })

  it('ignores sessions that forced a variant for review', () => {
    const rows = summarize([ev('v1', 'exposure', 'A', {}, true), ev('v1', 'message_sent', 'A', {}, true)])
    expect(rows.every((r) => r.visitors === 0 && r.messages === 0)).toBe(true)
  })

  it('reports no time when nobody opened a chat', () => {
    const rows = summarize([ev('v1', 'exposure', 'A')])
    expect(rows.find((r) => r.experiment === 'chat_list' && r.variant === 'A')!.avgMsToFirstOpen).toBeNull()
  })

  it('counts groups opened for the group navigation experiment, not chats', () => {
    const rows = summarize([
      ev('v1', 'group_opened', 'B', { first: true, ms_since_list: 1500 }),
      ev('v1', 'chat_opened', 'B', { first: true, ms_since_list: 100 }),
    ])
    expect(rows.find((r) => r.experiment === 'group_nav' && r.variant === 'B')).toMatchObject({ opens: 1, avgMsToFirstOpen: 1500 })
    expect(rows.find((r) => r.experiment === 'chat_list' && r.variant === 'B')).toMatchObject({ opens: 1, avgMsToFirstOpen: 100 })
  })
})
