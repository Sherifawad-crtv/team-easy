import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CallsProvider } from '../state/calls'
import { ContactSheet } from '../features/chat/ContactSheet'
import type { Conversation } from '../data/types'

afterEach(cleanup)
const direct: Conversation = { id: 'c1', kind: 'direct', title: 'Dana Cole', lastMessage: '', lastAt: 0, unread: 0, presence: 'online' }

describe('contact sheet', () => {
  it('shows who the person is and whether they are online', () => {
    render(<MemoryRouter><CallsProvider><ContactSheet conversation={direct} onClose={() => {}} /></CallsProvider></MemoryRouter>)
    expect(screen.getByText('Dana Cole')).toBeTruthy()
    expect(screen.getByText('Online')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Mute/ }))
    expect(screen.getByRole('button', { name: /Unmute/ })).toBeTruthy()
  })
})
