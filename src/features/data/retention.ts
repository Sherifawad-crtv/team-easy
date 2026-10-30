import { LIMITS } from '../../config/limits'

const DAY = 86_400_000

/** How long is left before something is deleted, in plain words. `urgent` when it is nearly gone. */
export function daysLeftLabel(deleteAt: number, now = Date.now()): { text: string; urgent: boolean } {
  const ms = deleteAt - now
  if (ms <= 0) return { text: 'Deleting now', urgent: true }
  const hours = Math.ceil(ms / 3_600_000)
  if (hours < 24) return { text: hours === 1 ? '1 hour left' : `${hours} hours left`, urgent: true }
  const days = Math.ceil(ms / DAY)
  return { text: days === 1 ? '1 day left' : `${days} days left`, urgent: days <= LIMITS.expiryWarningDays }
}

/** Show the "deleted soon" note only when little time is left. */
export const isExpiringSoon = (expiresAt: number, now = Date.now()) => expiresAt - now <= LIMITS.expiryWarningDays * DAY
