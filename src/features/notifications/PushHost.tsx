import { useEffect, useRef, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { PushNotification } from '../../data/types'
import { IconBell } from '../../design/icons'
import { track } from '../../experiments/analytics'

const SHOW_MS = 5000

/**
 * Pushes that arrive while the app is open, drawn like the system banner
 * (NTF-02, NTF-03). A tap opens the chat, or the release, update or offer.
 * With the app closed the OS shows them (wire `notifications.push`).
 */
export function PushHost() {
  const [push, setPush] = useState<PushNotification | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const here = useRef(pathname)
  here.current = pathname
  const timer = useRef<number>(undefined)

  useEffect(
    () =>
      api.notifications.subscribe((p) => {
        // Don't announce the chat you are looking at.
        const open = matchPath('/chats/:id', here.current)?.params.id
        if (p.target.type === 'chat' && p.target.conversationId === open) return
        void api.permissions.status('notifications').then((s) => {
          if (s === 'denied') return
          setPush(p)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setPush(null), SHOW_MS)
        })
      }),
    [],
  )
  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!push) return null
  const open = () => {
    track('push_opened', { target: push.target.type })
    setPush(null)
    navigate(push.target.type === 'chat' ? `/chats/${push.target.conversationId}` : `/updates/${push.target.updateId}`)
  }
  return (
    <div className="push" role="status" aria-live="polite">
      <button type="button" className="push__main" onClick={open} aria-label={`${push.title}. ${push.body}. Open`}>
        <span className="push__icon"><IconBell size={20} /></span>
        <span className="people__text">
          <span className="t-title-sm people__name">{push.title}</span>
          <span className="push__body">{push.body}</span>
        </span>
      </button>
    </div>
  )
}
