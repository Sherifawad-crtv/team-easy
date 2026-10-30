// Mock for the built-in calendar and its assignment (CAL-01, CAL-02).

import type { CalendarApi } from '../api'
import { ApiError } from '../errors'
import type { CalendarEvent, CalendarInfo } from '../types'
import { roleStore } from './role'
import { scenarioStore } from './scenario'
import { MEMBERS, ME } from './seed'

interface Cal {
  id: string
  name: string
  description: string
  tone: number
  assigned: Set<string>
}

const everyone = () => new Set([ME.id, ...MEMBERS.map((m) => m.id)])

const seed = (): Cal[] => [
  { id: 'cal-company', name: 'Company', description: 'All-hands, offsites and company news', tone: 0, assigned: everyone() },
  { id: 'cal-product', name: 'Product', description: 'Planning and reviews for the product team', tone: 1,
    assigned: new Set([ME.id, 'u-priya', 'u-jonas', 'u-noor', 'u-yuki', 'u-sam']) },
  { id: 'cal-launch', name: 'Q4 Launch', description: 'Checkpoints and sign-offs for the launch', tone: 2,
    assigned: new Set([ME.id, 'u-sam', 'u-priya', 'u-omar', 'u-amelia']) },
  { id: 'cal-holidays', name: 'Public holidays', description: 'Days the office is closed', tone: 3, assigned: everyone() },
  { id: 'cal-oncall', name: 'Support on-call', description: 'Who covers support, week by week', tone: 4,
    assigned: new Set(['u-fatima', 'u-marco', 'u-amelia']) },
]

const DAY = 86_400_000

function at(day: Date, hour: number, minute = 0): number {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime()
}

const isoWeek = (d: Date) => Math.floor((d.getTime() - new Date(2026, 0, 5).getTime()) / (7 * DAY))

/** The recurring and one-off events of one day. Deterministic, so screenshots and tests repeat. */
function eventsOn(day: Date): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
  const add = (calendarId: string, title: string, start: number, mins: number, extra: Partial<CalendarEvent> = {}) =>
    out.push({ id: `${calendarId}:${key}:${title}`, calendarId, title, start, end: start + mins * 60_000, allDay: false, ...extra })
  const wd = day.getDay()
  if (wd === 1) add('cal-company', 'All-hands', at(day, 10), 45, { location: 'Main hall', description: 'Weekly update from the leadership team. Questions are taken in the announcements chat.' })
  if (wd === 2 && isoWeek(day) % 2 === 0) add('cal-product', 'Sprint planning', at(day, 14), 90, { location: 'Room 3', description: 'Pick the work for the next two weeks.' })
  if (wd === 3) add('cal-launch', 'Launch checkpoint', at(day, 16), 30, { description: 'Status of QA sign-off, push notifications and store review.' })
  if (wd === 4) add('cal-product', 'Design review', at(day, 11), 60, { location: 'Room 3', description: 'Walk through the latest mobile designs.' })
  if (wd === 4) add('cal-product', 'Roadmap sync', at(day, 15, 30), 30)
  if (wd === 5) add('cal-oncall', 'Support rota handover', at(day, 15), 30)
  // The offsite announced in the announcements chat: the coming Friday.
  const friday = new Date()
  friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7))
  if (day.getFullYear() === friday.getFullYear() && day.getMonth() === friday.getMonth() && day.getDate() === friday.getDate()) {
    out.push({ id: `cal-company:${key}:offsite`, calendarId: 'cal-company', title: 'Company offsite', start: at(day, 0), end: at(day, 23, 59), allDay: true, location: 'Lakeside venue', description: 'The office is closed. Transport leaves from the main entrance at 8:30.' })
  }
  if (key === '2026-12-25') out.push({ id: `cal-holidays:${key}`, calendarId: 'cal-holidays', title: 'Public holiday', start: at(day, 0), end: at(day, 23, 59), allDay: true, description: 'The office is closed.' })
  if (key === '2027-1-1') out.push({ id: `cal-holidays:${key}`, calendarId: 'cal-holidays', title: "New Year's Day", start: at(day, 0), end: at(day, 23, 59), allDay: true, description: 'The office is closed.' })
  return out
}

export function createCalendar(deps: { gate: (base?: number) => Promise<void> }) {
  let cals = seed()
  const isAdmin = () => roleStore.get() === 'admin'
  const visible = () => (isAdmin() ? cals : cals.filter((c) => c.assigned.has(ME.id)))

  const api: CalendarApi = {
    async calendars() {
      await deps.gate()
      if (scenarioStore.get() === 'empty') return []
      return visible().map((c): CalendarInfo => ({
        id: c.id, name: c.name, description: c.description, tone: c.tone,
        assigned: c.assigned.has(ME.id), assignedCount: c.assigned.size,
      }))
    },
    async events(from, to) {
      await deps.gate(350)
      if (scenarioStore.get() === 'empty') return []
      const ids = new Set(visible().map((c) => c.id))
      const out: CalendarEvent[] = []
      const day = new Date(from)
      day.setHours(0, 0, 0, 0)
      for (; day.getTime() < to; day.setDate(day.getDate() + 1)) {
        for (const e of eventsOn(new Date(day))) if (ids.has(e.calendarId)) out.push(e)
      }
      return out.sort((a, b) => a.start - b.start)
    },
    async assignees(calendarId) {
      await deps.gate(300)
      if (!isAdmin()) throw new ApiError('not_allowed')
      const cal = cals.find((c) => c.id === calendarId)
      if (!cal) throw new ApiError('unknown')
      return [{ id: ME.id, name: ME.name, jobTitle: 'Product designer' }, ...MEMBERS].map((m) => ({
        id: m.id, name: m.name, jobTitle: (m as { jobTitle?: string }).jobTitle, assigned: cal.assigned.has(m.id),
      }))
    },
    async assign(calendarId, memberIds) {
      await deps.gate(500)
      if (!isAdmin()) throw new ApiError('not_allowed')
      const cal = cals.find((c) => c.id === calendarId)
      if (!cal) throw new ApiError('unknown')
      cal.assigned = new Set(memberIds)
    },
  }
  return { api, reset: () => { cals = seed() } }
}
