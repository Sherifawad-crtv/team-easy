import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageAttachment } from '../features/media/MessageAttachment'
import { settings } from '../state/settings'
import type { Message } from '../data/types'

const message = (over: Partial<Message['attachment']> = {}): Message => ({
  id: 'm1', conversationId: 'c', senderId: 'u-x', senderName: 'Omar', text: '', at: Date.now(), status: 'sent',
  attachment: { kind: 'image', name: 'photo.png', size: 1_400_000, mime: 'image/png', url: 'data:image/png;base64,AAAA', ...over },
})

beforeEach(() => {
  localStorage.clear()
  settings.clearCache()
  settings.setPolicy('wifi')
  settings.setConnection('cellular')
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('received files (MED-05, DAT-03)', () => {
  it('waits for a tap on mobile data with the Wi-Fi only setting, then keeps the file', () => {
    vi.useFakeTimers()
    render(<MessageAttachment message={message()} mine={false} />)
    const wait = screen.getByRole('button', { name: /Download photo/ })
    expect(wait.textContent).toContain('1.4 MB')
    fireEvent.click(wait)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: /Open photo/ })).toBeTruthy()
    expect(settings.isCached('m1')).toBe(true)
  })

  it('shows straight away on Wi-Fi and for files I sent', () => {
    settings.setConnection('wifi')
    render(<MessageAttachment message={message()} mine={false} />)
    expect(screen.getByRole('button', { name: /Open photo/ })).toBeTruthy()
    cleanup()
    settings.setConnection('cellular')
    render(<MessageAttachment message={message()} mine />)
    expect(screen.getByRole('button', { name: /Open photo/ })).toBeTruthy()
  })

  it('tells the person when a file was deleted by the retention rule (DAT-02)', () => {
    render(<MessageAttachment message={message({ expired: true, url: undefined })} mine={false} />)
    expect(screen.getByText(/no longer available/)).toBeTruthy()
  })

  it('shows a document with its type and size', () => {
    settings.setPolicy('auto')
    render(<MessageAttachment message={message({ kind: 'document', name: 'Q4-roadmap.pdf', size: 1_240_000, url: undefined })} mine={false} />)
    expect(screen.getByText('Q4-roadmap.pdf')).toBeTruthy()
    expect(screen.getByText(/PDF · 1\.2 MB/)).toBeTruthy()
  })
})
