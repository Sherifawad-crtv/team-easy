import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { mockApi } from '../data/mock/mockApi'
import { scenarioStore } from '../data/mock/scenario'
import { ChatList } from '../features/chat/ChatList'
import type { Conversation } from '../data/types'

const conv = (over: Partial<Conversation>): Conversation => ({ id: 'c-priya', kind: 'direct', title: 'Priya Raman', lastMessage: 'hi', lastAt: Date.now(), unread: 0, ...over })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
})
afterEach(cleanup)

const renderList = (data: Conversation[]) =>
  render(<MemoryRouter><ChatList state={{ status: 'ready', data }} onOpen={() => {}} onRetry={() => {}} onNewChat={() => {}} /></MemoryRouter>)

describe('chat row actions', () => {
  it('opens a sheet with Mark as unread and Mute on a right click, and runs them', async () => {
    const unread = vi.spyOn(mockApi.chat, 'markUnread')
    const mute = vi.spyOn(mockApi.chat, 'setMuted')
    renderList([conv({})])
    fireEvent.contextMenu(screen.getByRole('button', { name: /Priya Raman/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Mark as unread/ }))
    expect(unread).toHaveBeenCalledWith('c-priya')
    fireEvent.contextMenu(screen.getByRole('button', { name: /Priya Raman/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Mute notifications/ }))
    expect(mute).toHaveBeenCalledWith('c-priya', true)
  })

  it('offers Mark as read and Unmute when a chat is already unread and muted', async () => {
    renderList([conv({ unread: 3, muted: true })])
    fireEvent.contextMenu(screen.getByRole('button', { name: /Priya Raman/ }))
    expect(await screen.findByRole('button', { name: /Mark as read/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Unmute notifications/ })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Muted' })).toBeTruthy()
  })

  it('shows a dot for a chat marked unread, and the Unread filter counts it', () => {
    renderList([conv({ flaggedUnread: true }), conv({ id: 'c-x', title: 'Someone Else' })])
    expect(screen.getByRole('img', { name: 'Marked as unread' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Unread/ }))
    expect(screen.getByText('Priya Raman')).toBeTruthy()
    expect(screen.queryByText('Someone Else')).toBeNull()
  })
})
