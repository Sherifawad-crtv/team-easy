import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { roleStore } from '../data/mock/role'
import { scenarioStore } from '../data/mock/scenario'
import { simulateCallTimeLeft, simulateIncomingCall } from '../data/mock/mockApi'
import { CallButtons } from '../features/calls/CallButtons'
import { CallOverlay } from '../features/calls/CallOverlay'
import { CallsProvider } from '../state/calls'
import type { Conversation } from '../data/types'

const conv = (over: Partial<Conversation>): Conversation => ({ id: 'c-omar', kind: 'direct', title: 'Omar Al-Fayed', lastMessage: '', lastAt: Date.now(), unread: 0, ...over })

const app = (c: Conversation) =>
  render(
    <MemoryRouter>
      <CallsProvider>
        <CallButtons conversation={c} />
        <CallOverlay />
      </CallsProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  scenarioStore.set('normal')
  roleStore.set('admin')
  simulateCallTimeLeft(null)
})
afterEach(cleanup)

describe('call buttons', () => {
  it('are offered in direct and group chats but not in announcements or a group you left', () => {
    app(conv({}))
    expect(screen.getByRole('button', { name: /Video call Omar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Audio call Omar/ })).toBeTruthy()
    cleanup()
    app(conv({ kind: 'general' }))
    expect(screen.queryByRole('button', { name: /call/i })).toBeNull()
    cleanup()
    app(conv({ kind: 'group', left: true }))
    expect(screen.queryByRole('button', { name: /call/i })).toBeNull()
  })
})

describe('call flow', () => {
  it('asks for the microphone first, rings, then ends with a summary', async () => {
    app(conv({}))
    fireEvent.click(screen.getByRole('button', { name: /Audio call Omar/ }))
    await screen.findByText('Allow your microphone', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    const dialog = await screen.findByRole('dialog', { name: /audio call with Omar/i }, { timeout: 4000 })
    expect(dialog.textContent).toContain('Ringing')
    await waitFor(() => expect(dialog.querySelector('[role=timer]')?.textContent).toMatch(/^\d:\d\d/), { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: /^End/ }))
    await screen.findByText('Call ended', {}, { timeout: 3000 })
    expect(screen.getByRole('button', { name: 'Call again' })).toBeTruthy()
  }, 20000)

  it('says so when there is no calling time left', async () => {
    simulateCallTimeLeft(0)
    app(conv({}))
    fireEvent.click(screen.getByRole('button', { name: /Audio call Omar/ }))
    await screen.findByText('No calling time left', {}, { timeout: 3000 })
  })

  it('shows an incoming call you can decline', async () => {
    localStorage.setItem('te.perm.microphone', 'granted')
    app(conv({}))
    simulateIncomingCall('direct', 'audio')
    await screen.findByRole('alertdialog', { name: /Incoming audio call from Omar/ }, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull(), { timeout: 3000 })
  })
})
