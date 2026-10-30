import type { CalendarEvent } from '../../data/types'

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/** Weeks start on Monday (assumed, open question 17). */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** The six weeks shown for a month, as 42 days starting on a Monday. */
export function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export const eventsOn = (events: CalendarEvent[], day: Date) => events.filter((e) => sameDay(new Date(e.start), day))

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function eventTime(e: CalendarEvent): string {
  return e.allDay ? 'All day' : `${time(e.start)} to ${time(e.end)}`
}

export const monthLabel = (d: Date) => d.toLocaleDateString([], { month: 'long', year: 'numeric' })
export const dayLabel = (d: Date) => d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
