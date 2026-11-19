import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ImageViewer } from '../features/media/ImageViewer'
import type { Message } from '../data/types'
import { BottomSheet } from './ui'

afterEach(cleanup)

// A sliding screen is moved with a transform, so anything fixed inside it belongs to that
// screen and its top bar ends up over the layer. Layers must live directly in the page body.
describe('layers sit above every screen', () => {
  it('draws a sheet in the page body, not inside the screen that opened it', () => {
    const { container } = render(<div style={{ transform: 'translateX(0)' }}><BottomSheet title="Test" onClose={() => {}}><p>Inside</p></BottomSheet></div>)
    const sheet = screen.getByRole('dialog', { name: 'Test' })
    expect(container.contains(sheet)).toBe(false)
    expect(sheet.closest('.sheet-backdrop')?.parentElement).toBe(document.body)
  })

  it('draws the photo viewer in the page body', () => {
    const message = { id: 'm1', conversationId: 'c', senderId: 'x', senderName: 'Sam', text: '', at: 0, status: 'sent', attachment: { kind: 'image', name: 'a.png', url: 'data:image/png;base64,AA==', size: 1 } } as unknown as Message
    const { container } = render(<div style={{ transform: 'translateX(0)' }}><ImageViewer message={message} onClose={() => {}} /></div>)
    const viewer = screen.getByRole('dialog', { name: 'a.png' })
    expect(container.contains(viewer)).toBe(false)
    expect(viewer.parentElement).toBe(document.body)
  })
})
