import { useEffect } from 'react'
import { IconClose } from '../../design/icons'
import type { Message } from '../../data/types'
import { messageTime } from '../chat/format'

/** Full-screen image. Tap outside or press Escape to close. */
export function ImageViewer({ message, onClose }: { message: Message; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const a = message.attachment
  if (!a?.url) return null
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={a.name} onClick={onClose}>
      <header className="viewer__bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn viewer__close" aria-label="Close" onClick={onClose}><IconClose /></button>
        <div className="viewer__who">
          <p className="viewer__name">{message.senderId === 'me' ? 'You' : message.senderName}</p>
          <p className="viewer__sub">{a.name} · {messageTime(message.at)}</p>
        </div>
      </header>
      <img className="viewer__img" src={a.url} alt={message.text || a.name} onClick={(e) => e.stopPropagation()} />
      {message.text && <p className="viewer__caption" onClick={(e) => e.stopPropagation()}>{message.text}</p>}
    </div>
  )
}
