import { describe, expect, it } from 'vitest'
import { dayLabel, listTime } from './format'

const now = new Date(2026, 9, 17, 15, 0).getTime()
const at = (daysAgo: number, h = 9) => new Date(2026, 9, 17 - daysAgo, h, 5).getTime()

describe('chat time labels', () => {
  it('shows a clock time today, then Yesterday, then weekday, then date', () => {
    expect(listTime(at(0), now)).toMatch(/9:05/)
    expect(listTime(at(1), now)).toBe('Yesterday')
    expect(listTime(at(3), now)).toMatch(/^[A-Za-z]+$/)
    expect(listTime(at(12), now)).toMatch(/\d/)
  })
  it('labels days inside a conversation', () => {
    expect(dayLabel(at(0), now)).toBe('Today')
    expect(dayLabel(at(1), now)).toBe('Yesterday')
  })
})
