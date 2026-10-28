import type { Connection, MediaPolicy } from '../../state/settings'

export type MediaState = 'ready' | 'needs-download' | 'expired'

/**
 * Whether a received file shows straight away (MED-05, DAT-03).
 * Files I sent, files already opened or downloaded, and files the download
 * setting allows right now are ready. Everything else waits for a tap.
 */
export function mediaState(input: {
  mine: boolean
  expired: boolean
  cached: boolean
  policy: MediaPolicy
  connection: Connection
}): MediaState {
  if (input.expired) return 'expired'
  if (input.mine || input.cached) return 'ready'
  if (input.policy === 'auto') return 'ready'
  if (input.policy === 'wifi' && input.connection === 'wifi') return 'ready'
  return 'needs-download'
}
