import { describe, expect, it } from 'vitest'
import { daysLeftLabel, isExpiringSoon } from './retention'

const NOW = Date.UTC(2026, 9, 30, 12)
const H = 3_600_000

describe('retention wording', () => {
  it('counts hours under a day and days above', () => {
    expect(daysLeftLabel(NOW + 5 * H, NOW)).toEqual({ text: '5 hours left', urgent: true })
    expect(daysLeftLabel(NOW + 50 * H, NOW)).toEqual({ text: '3 days left', urgent: true })
    expect(daysLeftLabel(NOW + 5 * 24 * H, NOW)).toEqual({ text: '5 days left', urgent: false })
    expect(daysLeftLabel(NOW - 1, NOW).text).toBe('Deleting now')
  })

  it('only warns inside the warning window', () => {
    expect(isExpiringSoon(NOW + 2 * 24 * H, NOW)).toBe(true)
    expect(isExpiringSoon(NOW + 5 * 24 * H, NOW)).toBe(false)
  })
})
