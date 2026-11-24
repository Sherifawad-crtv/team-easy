import { useEffect, useRef } from 'react'
import type { Message } from '../../data/types'
import { haptic } from '../../design/haptics'
import { Overlay } from '../../design/ui'
import { IconCopy, IconFlag, IconRetry, IconTrash } from '../../design/icons'

export interface MenuActions {
  copy?: () => void
  remove?: () => void
  retry?: () => void
  discard?: () => void
  report?: () => void
}

/**
 * The menu a long press on a message opens, like iPhone: the rest of the chat
 * blurs, the message lifts a little where it was, and a card of actions pops
 * in beside it. The lifted message is a copy of the real one drawn at the same place.
 */
export function MessageMenu({ message, bubble, actions, onClose }: { message: Message; bubble: HTMLElement; actions: MenuActions; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  // Lifting the finger after the long press can arrive as a click on the backdrop: ignore clicks
  // until a moment after the finger comes up (and for at least the first half second).
  const armedAt = useRef(Date.now() + 450)
  const card = useRef<HTMLDivElement>(null)
  const row = bubble.closest('.msg') as HTMLElement | null
  const rect = bubble.getBoundingClientRect()
  const rowRect = (row ?? bubble).getBoundingClientRect()
  const mine = message.senderId === 'me'

  useEffect(() => {
    haptic('light')
    if (row && host.current) {
      const copy = row.cloneNode(true) as HTMLElement
      copy.classList.remove('msg--hit', 'msg--enter')
      copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
      copy.setAttribute('aria-hidden', 'true')
      host.current.replaceChildren(copy)
    }
    const lifted = () => { armedAt.current = Math.max(armedAt.current, Date.now() + 200) }
    document.addEventListener('touchend', lifted)
    document.addEventListener('pointerup', lifted)
    card.current?.querySelector('button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('touchend', lifted)
      document.removeEventListener('pointerup', lifted)
    }
  }, [row, onClose])

  const items = [
    actions.retry && { label: 'Try sending again', icon: <IconRetry size={20} />, run: actions.retry },
    actions.copy && { label: 'Copy', icon: <IconCopy size={20} />, run: actions.copy },
    actions.discard && { label: 'Discard message', icon: <IconTrash size={20} />, run: actions.discard, danger: true },
    actions.report && { label: 'Report', icon: <IconFlag size={20} />, run: actions.report, danger: true },
    actions.remove && { label: 'Delete message', icon: <IconTrash size={20} />, run: actions.remove, danger: true },
  ].filter(Boolean) as { label: string; icon: React.ReactNode; run: () => void; danger?: boolean }[]

  const cardHeight = items.length * 52 + 12
  const below = window.innerHeight - rect.bottom
  const top = below > cardHeight + 28 ? rect.bottom + 12 : Math.max(12, rect.top - cardHeight - 12)

  return (
    <Overlay>
    <div className="mmenu" role="dialog" aria-label="Message actions" onClick={() => { if (Date.now() > armedAt.current) onClose() }}>
      <div className="mmenu__clone" ref={host} style={{ top: rowRect.top, left: rowRect.left, width: rowRect.width, transformOrigin: mine ? 'right center' : 'left center' }} />
      <div className="mmenu__card" ref={card} style={{ top, [mine ? 'right' : 'left']: mine ? window.innerWidth - rect.right : rect.left, transformOrigin: mine ? 'top right' : 'top left' }} onClick={(e) => e.stopPropagation()}>
        {items.map((it) => (
          <button key={it.label} type="button" className={`mmenu__item${it.danger ? ' is-danger' : ''}`} onClick={() => { it.run(); onClose() }}>
            {it.icon}<span>{it.label}</span>
          </button>
        ))}
      </div>
    </div>
    </Overlay>
  )
}
