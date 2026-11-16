import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BottomSheet } from '../design/ui'
import { scenarioStore } from '../data/mock/scenario'
import { ConversationView } from '../features/chat/Conversation'
import { ImageViewer } from '../features/media/ImageViewer'
import { InCall } from '../features/calls/InCall'
import { CallsProvider, useCalls } from '../state/calls'
import { resetExperiments } from '../experiments/experiments'
import type { Conversation, Message } from '../data/types'

// Every gesture needs a visible control or key for people who cannot or do not want to make it.
// (docs/MOTION_PLAN.md, M6.) Pull to refresh is the one exception, noted in the plan.

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  scenarioStore.set('normal')
  resetExperiments()
})
afterEach(cleanup)

describe('gestures have an alternative', () => {
  it('a sheet that can be dragged shut also closes with Escape and a tap outside', () => {
    const onClose = vi.fn()
    render(<BottomSheet title="Hello" onClose={onClose}><p>Body</p></BottomSheet>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.mouseDown(document.querySelector('.sheet-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('the picture viewer has a Close button and closes with Escape, besides pulling it down', () => {
    const onClose = vi.fn()
    const message: Message = {
      id: 'm', conversationId: 'c', senderId: 'u', senderName: 'Omar', text: '', at: Date.now(), status: 'sent',
      attachment: { kind: 'image', name: 'a.png', size: 1, mime: 'image/png', url: 'data:image/png;base64,AAAA' },
    }
    render(<ImageViewer message={message} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('a chat has a Back button, so the edge swipe is never the only way back', async () => {
    const conv: Conversation = { id: 'c-omar', kind: 'direct', title: 'Omar Al-Fayed', lastMessage: '', lastAt: Date.now(), unread: 0 }
    render(<MemoryRouter><CallsProvider><ConversationView conversation={conv} onBack={() => {}} /></CallsProvider></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Back to chats' })).toBeTruthy()
    // The long-press menu on a message also opens from a right click or the context menu key.
    await waitFor(() => expect(document.querySelectorAll('.bubble').length).toBeGreaterThan(0), { timeout: 4000 })
    const mine = [...document.querySelectorAll<HTMLElement>('.msg--mine .bubble')].pop()!
    fireEvent.contextMenu(mine)
    await screen.findByRole('button', { name: /Delete message/ })
  })

  it('the call screen has a Minimize button, besides pulling it down', async () => {
    localStorage.setItem('te.perm.microphone', 'granted')
    render(<MemoryRouter><CallsProvider><StartedCall /></CallsProvider></MemoryRouter>)
    await screen.findByRole('dialog', { name: /audio call with/i }, { timeout: 5000 })
    expect(screen.getByRole('button', { name: 'Minimize call' })).toBeTruthy()
  }, 15000)
})

/** Starts a call as soon as it is shown, and draws the call screen. */
function StartedCall() {
  const calls = useCalls()
  const { start } = calls
  useEffect(() => { void start('c-omar', 'audio') }, [start])
  return calls.call ? <InCall /> : null
}
