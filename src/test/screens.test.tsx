import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { scenarioStore } from '../data/mock/scenario'
import { ChatList } from '../features/chat/ChatList'
import { resetExperiments, variants } from '../experiments/experiments'
import type { Conversation } from '../data/types'

const conv = (over: Partial<Conversation>): Conversation => ({
  id: 'x', kind: 'direct', title: 'Someone', lastMessage: 'hi', lastAt: Date.now(), unread: 0, ...over,
})
const DATA: Conversation[] = [
  conv({ id: 'g', kind: 'general', title: 'Announcements', unread: 200 }),
  conv({ id: 'a', title: 'Amelia', unread: 2 }),
  conv({ id: 'b', kind: 'group', title: 'Product Team' }),
]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  resetExperiments()
})
afterEach(cleanup)

const renderList = (status: 'ready' | 'loading' | 'error' = 'ready', data: Conversation[] = DATA) =>
  render(<MemoryRouter><ChatList state={{ status, data, error: new Error('x') }} onOpen={() => {}} onRetry={() => {}} onNewChat={() => {}} /></MemoryRouter>)

describe('chat list variants', () => {
  it('A is a plain list without filters', () => {
    act(() => variants.setOverride('chat_list', 'A'))
    renderList()
    expect(screen.queryByRole('group', { name: 'Filter chats' })).toBeNull()
    expect(screen.getByText('Amelia')).toBeTruthy()
  })

  it('B adds filter chips and filters by unread', () => {
    act(() => variants.setOverride('chat_list', 'B'))
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Unread/ }))
    expect(screen.getByText('Amelia')).toBeTruthy()
    expect(screen.queryByText('Product Team')).toBeNull()
  })

  it('shows the empty state with a way forward', () => {
    renderList('ready', [])
    expect(screen.getByText('No conversations yet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start a chat' })).toBeTruthy()
  })

  it('shows a loading skeleton and an error with retry', () => {
    renderList('loading', [])
    expect(screen.getByLabelText('Loading chats')).toBeTruthy()
    cleanup()
    renderList('error', [])
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})

describe('onboarding', () => {
  it('shows the welcome screen when signed out and validates sign in', async () => {
    window.history.replaceState({}, '', '/')
    render(<App />)
    await waitFor(() => expect(screen.getByText('Your team, one tap away.')).toBeTruthy(), { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter your email address')).toBeTruthy()
    expect(screen.getByText('Enter your password')).toBeTruthy()
  })
})
