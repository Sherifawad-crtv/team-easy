import { LIMITS } from '../../config/limits'
import type { CallEndReason, CallMode, CallParticipant, CallRecord } from '../../data/types'

/** 3:05 or 1:02:09 */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** "12 min" for lists, where seconds are noise. */
export function minutes(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} sec`
  return `${Math.floor(seconds / 60)} min`
}

export const modeLabel = (mode: CallMode, group: boolean) => `${group ? 'Group ' : ''}${mode === 'video' ? 'video' : 'audio'} call`

export function endedText(reason: CallEndReason, mode: CallMode): { title: string; body: string } {
  switch (reason) {
    case 'cap_reached':
      return { title: "You've used today's calling time", body: 'Calls are limited to 1 hour a day. Your time starts again at midnight.' }
    case 'declined':
      return { title: 'Call declined', body: 'They are not available right now. Try again later or send a message.' }
    case 'no_answer':
      return { title: 'No answer', body: `Nobody picked up the ${mode} call. Send a message so they know.` }
    case 'failed':
      return { title: "The call didn't connect", body: 'Check your connection and try again.' }
    default:
      return { title: 'Call ended', body: '' }
  }
}

/** The status line under a participant's name. */
export function participantStatus(p: CallParticipant): string {
  switch (p.state) {
    case 'ringing': return 'Ringing…'
    case 'declined': return 'Declined'
    case 'no_answer': return 'No answer'
    case 'left': return 'Left'
    default: return p.muted ? 'Muted' : p.speaking ? 'Speaking' : ''
  }
}

/** Which warning to show for the time left today, if any. */
export function capWarning(remaining: number | null): string | null {
  if (remaining === null) return null
  const [first, second] = LIMITS.callWarnSeconds
  if (remaining <= second) return `Less than a minute of calling left today`
  if (remaining <= first) return `${Math.ceil(remaining / 60)} minutes of calling left today`
  return null
}

export const directionLabel = (d: CallRecord['direction']) => (d === 'missed' ? 'Missed' : d === 'incoming' ? 'Incoming' : 'Outgoing')
