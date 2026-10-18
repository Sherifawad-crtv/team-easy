const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const DAY = 86_400_000

/** Compact time for the chat list: time today, "Yesterday", weekday, then date. */
export function listTime(at: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY)
  if (days <= 0) return timeFmt.format(at)
  if (days === 1) return 'Yesterday'
  if (days < 7) return weekdayFmt.format(at)
  return dateFmt.format(at)
}

export const messageTime = (at: number) => timeFmt.format(at)

/** Label for the separator between days inside a conversation. */
export function dayLabel(at: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return weekdayFmt.format(at)
  return dateFmt.format(at)
}

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b)
