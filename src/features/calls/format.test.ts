import { describe, expect, it } from 'vitest'
import { capWarning, clock, endedText, minutes } from './format'

describe('call wording', () => {
  it('formats the running time', () => {
    expect(clock(5)).toBe('0:05')
    expect(clock(185)).toBe('3:05')
    expect(clock(3725)).toBe('1:02:05')
  })

  it('rounds list durations down to whole minutes', () => {
    expect(minutes(40)).toBe('40 sec')
    expect(minutes(250)).toBe('4 min')
  })

  it('warns at 5 minutes and at 1 minute left, and not before', () => {
    expect(capWarning(1200)).toBeNull()
    expect(capWarning(null)).toBeNull()
    expect(capWarning(290)).toBe('5 minutes of calling left today')
    expect(capWarning(45)).toBe('Less than a minute of calling left today')
  })

  it('explains why a call ended', () => {
    expect(endedText('cap_reached', 'audio').title).toMatch(/calling time/)
    expect(endedText('no_answer', 'video').body).toMatch(/video call/)
    expect(endedText('ended', 'audio').title).toBe('Call ended')
  })
})
