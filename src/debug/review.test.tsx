import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EXPERIMENT_IDS, resetExperiments, variants } from '../experiments/experiments'
import { experimentsFor, COMPARE } from './compareInfo'
import { DebugPanel } from './ReviewPanel'
import { decidedCount, summaryText, verdicts } from './verdicts'

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  verdicts.clear()
  resetExperiments()
})

describe('verdicts', () => {
  it('keeps a pick and a note and reads them back from storage', () => {
    verdicts.set('chat_list', 'B', 'chips are quicker')
    verdicts.reload()
    expect(verdicts.get().chat_list).toMatchObject({ pick: 'B', note: 'chips are quicker' })
  })
  it('counts only real decisions', () => {
    verdicts.set('chat_list', 'A')
    verdicts.set('conversation', 'unsure')
    expect(decidedCount(verdicts.get())).toBe(1)
  })
  it('writes one line for every experiment', () => {
    verdicts.set('group_nav', 'B')
    const lines = summaryText(verdicts.get(), COMPARE).split('\n')
    expect(lines).toHaveLength(EXPERIMENT_IDS.length + 1)
    expect(summaryText(verdicts.get(), COMPARE)).toContain('Not decided')
    expect(summaryText(verdicts.get(), COMPARE)).toContain(COMPARE.group_nav.b)
  })
})

describe('quick switch mapping', () => {
  it('offers the experiments that show on each screen', () => {
    expect(experimentsFor('/chats')).toEqual(['chat_list', 'motion_style'])
    expect(experimentsFor('/chats/c-product')).toEqual(['conversation', 'motion_style'])
    expect(experimentsFor('/groups')).toEqual(['group_nav', 'motion_style'])
    expect(experimentsFor('/account')).toEqual(['motion_style'])
  })
})

describe('review panel', () => {
  const setup = () => render(<MemoryRouter initialEntries={['/chats']}><DebugPanel /></MemoryRouter>)
  it('flips the variant from the quick switch', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(variants.get('chat_list')).toBe('B')
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(variants.get('chat_list')).toBe('A')
  })
  it('opens on Compare, forces everything with the presets and records a choice', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Open review tools' }))
    fireEvent.click(screen.getByRole('button', { name: 'All B' }))
    expect(EXPERIMENT_IDS.every((id) => variants.get(id) === 'B')).toBe(true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Prefer A' })[0])
    expect(verdicts.get().chat_list?.pick).toBe('A')
    fireEvent.click(screen.getByRole('button', { name: 'Back to random' }))
    expect(variants.isForced()).toBe(false)
  })
  it('moves between tabs', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Open review tools' }))
    fireEvent.click(screen.getByRole('button', { name: 'States' }))
    expect(screen.getByRole('group', { name: 'Data state' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Motion' }))
    expect(screen.getByRole('button', { name: 'Tune the springs…' })).toBeTruthy()
  })
  it('hides the quick switch and remembers it', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Hide the quick switch' }))
    expect(localStorage.getItem('te.quick')).toBe('off')
    expect(screen.queryByRole('group', { name: 'Quick A/B switch' })).toBeNull()
  })
})
