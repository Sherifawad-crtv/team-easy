import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../data/types'
import { eventTime, eventsOn, monthGrid } from './dates'

describe('calendar dates', () => {
  it('builds six Monday-first weeks around the month', () => {
    const grid = monthGrid(new Date(2026, 9, 15)) // October 2026 starts on a Thursday
    expect(grid).toHaveLength(42)
    expect(grid[0].getDay()).toBe(1)
    expect(grid[0].getDate()).toBe(28) // Monday 28 September
    expect(grid.some((d) => d.getMonth() === 9 && d.getDate() === 31)).toBe(true)
  })

  it('finds the events of one day and words their time', () => {
    const e = (start: Date, over: Partial<CalendarEvent> = {}): CalendarEvent => ({
      id: String(start.getTime()), calendarId: 'c', title: 't', start: start.getTime(), end: start.getTime() + 3_600_000, allDay: false, ...over,
    })
    const list = [e(new Date(2026, 9, 30, 10)), e(new Date(2026, 9, 31, 10))]
    expect(eventsOn(list, new Date(2026, 9, 30))).toHaveLength(1)
    expect(eventTime(e(new Date(2026, 9, 30, 0), { allDay: true }))).toBe('All day')
    expect(eventTime(list[0])).toContain(' to ')
  })
})
