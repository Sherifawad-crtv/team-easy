import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../data'
import type { Conversation } from '../../data/types'
import { IconChat, IconEdit } from '../../design/icons'
import { track, trackExposure } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { UpdatesBanner } from '../notifications/UpdatesBanner'
import { ChatList } from './ChatList'
import { ConversationView } from './Conversation'
import { NewChatSheet } from './NewChatSheet'
import { listTiming } from './timing'

/** Chats: the list on phones, list plus conversation side by side on desktop. */
export function ChatsScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const list = useAsync(() => api.chat.listConversations(), [])
  const { patch } = list
  const [params, setParams] = useSearchParams()
  const sheet = params.get('new') === '1'
  const setSheet = (on: boolean) => setParams(on ? { new: '1' } : {}, { replace: true })
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (list.status === 'ready') {
      listTiming.shown()
      trackExposure('chat_list')
    }
  }, [list.status])

  // Realtime: keep the list fresh as conversations change.
  useEffect(
    () =>
      api.chat.subscribe((e) => {
        if (e.type !== 'conversation') return
        patch((prev) => {
          const next = prev.some((c) => c.id === e.conversation.id)
            ? prev.map((c) => (c.id === e.conversation.id ? e.conversation : c))
            : [...prev, e.conversation]
          return next.sort((a, b) => b.lastAt - a.lastAt)
        })
      }),
    [patch],
  )

  const open = useCallback(
    (convId: string, messageId?: string) => {
      const conv = list.status === 'ready' ? list.data.find((c) => c.id === convId) : undefined
      track('chat_opened', { conversation_id: convId, kind: conv?.kind, from_search: Boolean(messageId), ...listTiming.opened() })
      navigate(messageId ? `/chats/${convId}?m=${encodeURIComponent(messageId)}` : `/chats/${convId}`)
    },
    [list, navigate],
  )

  const current: Conversation | undefined = list.status === 'ready' ? list.data.find((c) => c.id === id) : undefined

  return (
    <div className="chats" data-open={id ? 'true' : 'false'}>
      <section className="chats__list" aria-label="Chats">
        <h1 className="sr-only">Chats</h1>
        <div className="chats__scroll" ref={scroller}>
          <ChatList
            state={list}
            activeId={id}
            onOpen={open}
            onRetry={list.reload}
            onNewChat={() => setSheet(true)}
            banner={<UpdatesBanner />}
            action={
              <button type="button" className="newchat" aria-label="New chat" onClick={() => setSheet(true)}>
                <IconEdit size={22} />
              </button>
            }
          />
        </div>
      </section>

      <section className="chats__pane" aria-label="Conversation">
        {current ? (
          <ConversationView key={current.id} conversation={current} highlightId={params.get('m') ?? undefined} onBack={() => navigate('/chats')} />
        ) : id && list.status === 'ready' ? (
          <div className="empty"><h2 className="t-title">That conversation isn't available</h2><p className="t-body-sm muted">It may have been removed.</p></div>
        ) : id ? (
          <div className="empty" aria-busy="true"><p className="t-body-sm muted">Loading…</p></div>
        ) : (
          <div className="empty empty--pane">
            <span className="empty__icon"><IconChat size={40} /></span>
            <h2 className="t-title">Pick a conversation</h2>
            <p className="t-body-sm muted">Choose a chat on the left, or start a new one.</p>
          </div>
        )}
      </section>

      {sheet && (
        <NewChatSheet
          onClose={() => setSheet(false)}
          onOpened={(c) => {
            setSheet(false)
            patch((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev]))
            track('chat_opened', { conversation_id: c.id, kind: c.kind, ...listTiming.opened() })
            navigate(`/chats/${c.id}`)
          }}
        />
      )}
    </div>
  )
}
