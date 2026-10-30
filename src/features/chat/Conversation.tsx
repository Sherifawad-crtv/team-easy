import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import type { Conversation as Conv, Message, MessageDraft } from '../../data/types'
import { Avatar, BackButton, Banner, BottomSheet, Button, Skeleton, toneFor } from '../../design/ui'
import { IconAttach, IconClock, IconDoubleTick, IconMegaphone, IconRetry, IconSend, IconTrash } from '../../design/icons'
import { track, trackExposure } from '../../experiments/analytics'
import { useVariant } from '../../experiments/experiments'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'
import { CallButtons } from '../calls/CallButtons'
import { AttachSheet } from '../media/AttachSheet'
import { MessageAttachment } from '../media/MessageAttachment'
import { dayLabel, messageTime, sameDay } from './format'

const ME = 'me'
const GROUP_GAP = 5 * 60_000
let tmpSeq = 0

type Item =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; m: Message; first: boolean; last: boolean; tail: boolean }

function buildItems(messages: Message[], grouped: boolean): Item[] {
  const items: Item[] = []
  messages.forEach((m, i) => {
    const prev = messages[i - 1]
    const next = messages[i + 1]
    if (!prev || !sameDay(prev.at, m.at)) items.push({ kind: 'day', key: `d-${m.id}`, label: dayLabel(m.at) })
    const joinsPrev = grouped && prev && sameDay(prev.at, m.at) && prev.senderId === m.senderId && m.at - prev.at < GROUP_GAP
    const joinsNext = grouped && next && sameDay(next.at, m.at) && next.senderId === m.senderId && next.at - m.at < GROUP_GAP
    // The bubble tail marks the start of a run from one person, in both variants.
    const startsRun = !(prev && sameDay(prev.at, m.at) && prev.senderId === m.senderId && m.at - prev.at < GROUP_GAP)
    items.push({ kind: 'msg', m, first: !joinsPrev, last: !joinsNext, tail: startsRun })
  })
  return items
}

function subtitle(c: Conv): string {
  if (c.left) return 'You left · read only'
  if (c.kind === 'direct') return c.presence === 'online' ? 'Online' : c.presence === 'away' ? 'Away' : 'Offline'
  if (c.kind === 'general') return `${c.memberCount ?? ''} members · Announcements`
  if (c.kind === 'subgroup') return `Sub-group of ${c.parent} · ${c.memberCount} members`
  return `${c.memberCount} members`
}

export function ConversationView({ conversation, onBack, highlightId }: { conversation: Conv; onBack: () => void; highlightId?: string }) {
  const id = conversation.id
  const navigate = useNavigate()
  const variant = useVariant('conversation')
  const grouped = variant === 'B'
  const isDirect = conversation.kind === 'direct'

  const history = useAsync(() => api.chat.listMessages(id), [id])
  const { patch } = history
  const [draft, setDraft] = useState('')
  const [actionFor, setActionFor] = useState<Message | null>(null)
  const [shownTimes, setShownTimes] = useState<Set<string>>(new Set())
  const [attaching, setAttaching] = useState(false)
  const drafts = useRef(new Map<string, MessageDraft>())
  const scrollRef = useRef<HTMLDivElement>(null)
  const pressTimer = useRef<number>(0)

  useEffect(() => {
    if (history.status === 'ready') {
      trackExposure('conversation')
      void api.chat.markRead(id)
    }
  }, [history.status, id])

  // Realtime: add messages from other people as they arrive.
  useEffect(
    () =>
      api.chat.subscribe((e) => {
        if (e.type === 'message' && e.message.conversationId === id && e.message.senderId !== ME) {
          patch((prev) => (prev.some((m) => m.id === e.message.id) ? prev : [...prev, e.message]))
          void api.chat.markRead(id)
        }
      }),
    [id, patch],
  )

  const count = history.status === 'ready' ? history.data.length : 0
  useEffect(() => {
    // Scroll only the message list, never the page around it.
    const el = scrollRef.current
    if (!el) return
    const target = highlightId ? el.querySelector<HTMLElement>(`[data-mid="${CSS.escape(highlightId)}"]`) : null
    if (target) target.scrollIntoView({ block: 'center' })
    else el.scrollTop = el.scrollHeight
  }, [count, history.status, highlightId])

  const send = useCallback(
    async (draft: MessageDraft, retryId?: string) => {
      const tmpId = retryId ?? `tmp-${++tmpSeq}`
      drafts.current.set(tmpId, draft)
      const file = draft.file
      const pending: Message = {
        id: tmpId, conversationId: id, senderId: ME, senderName: 'You', text: draft.text, at: Date.now(), status: 'sending',
        attachment: file
          ? { kind: file.type.startsWith('image/') ? 'image' : 'document', name: file.name, size: file.size, mime: file.type, url: URL.createObjectURL(file) }
          : undefined,
      }
      patch((prev) => (retryId ? prev.map((m) => (m.id === retryId ? pending : m)) : [...prev, pending]))
      try {
        const saved = await api.chat.sendMessage(id, draft)
        patch((prev) => prev.map((m) => (m.id === tmpId ? saved : m)))
        drafts.current.delete(tmpId)
        track('message_sent', { conversation_id: id, kind: conversation.kind, retry: Boolean(retryId), attachment: file ? (file.type.startsWith('image/') ? 'image' : 'document') : null })
      } catch {
        patch((prev) => prev.map((m) => (m.id === tmpId ? { ...m, status: 'failed' as const } : m)))
        track('message_failed', { conversation_id: id })
      }
    },
    [id, conversation.kind, patch],
  )

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void send({ text })
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault()
      submit()
    }
  }

  const remove = async (m: Message) => {
    setActionFor(null)
    patch((prev) => prev.filter((x) => x.id !== m.id))
    if (m.status === 'failed') return // never reached the server
    try {
      await api.chat.deleteMessage(id, m.id)
      track('message_deleted', { conversation_id: id })
    } catch {
      history.reload()
    }
  }

  const items = useMemo(() => (history.status === 'ready' ? buildItems(history.data, grouped) : []), [history, grouped])

  const actionable = (m: Message) => m.status === 'failed' || (isDirect && m.senderId === ME && m.status === 'sent')
  const startPress = (m: Message) => {
    if (!actionable(m)) return
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setActionFor(m), 450)
  }
  const endPress = () => window.clearTimeout(pressTimer.current)

  return (
    <div className="convo">
      <header className="convo__bar">
        <span className="convo__back"><BackButton onClick={onBack} label="Back to chats" /></span>
        <Avatar name={conversation.title} size={40} group={conversation.kind !== 'direct'} presence={isDirect ? conversation.presence : undefined} icon={conversation.kind === 'general' ? <IconMegaphone size={20} /> : undefined} tone={conversation.kind === 'general' ? 0 : undefined} />
        {conversation.groupId ? (
          <button type="button" className="convo__who convo__who--link" onClick={() => navigate(`/groups/${conversation.groupId}`)} aria-label={`${conversation.title}, group info`}>
            <h2 className="convo__title">{conversation.title}</h2>
            <p className="convo__sub">{subtitle(conversation)}</p>
          </button>
        ) : (
          <div className="convo__who">
            <h2 className="convo__title">{conversation.title}</h2>
            <p className="convo__sub">{subtitle(conversation)}</p>
          </div>
        )}
        <CallButtons conversation={conversation} />
      </header>

      <div className="convo__scroll" ref={scrollRef} role="log" aria-live="polite" aria-label={`Messages with ${conversation.title}`}>
        {history.status === 'loading' && (
          <div className="convo__skeleton" aria-busy="true" aria-label="Loading messages">
            {[62, 40, 70, 34, 56].map((w, i) => (
              <div key={i} style={{ alignSelf: i % 2 ? 'flex-end' : 'flex-start' }}>
                <Skeleton width={`${w}vw`} height={44} radius={20} />
              </div>
            ))}
          </div>
        )}
        {history.status === 'error' && (
          <div style={{ padding: 'var(--s-5)' }}><ErrorBanner error={history.error} onRetry={history.reload} /></div>
        )}
        {history.status === 'ready' && history.data.length === 0 && (
          <div className="empty">
            <h3 className="t-title">No messages yet</h3>
            <p className="t-body-sm muted">Say hello to {conversation.title} 👋</p>
          </div>
        )}
        {items.map((it) =>
          it.kind === 'day' ? (
            <div key={it.key} className="day"><span>{it.label}</span></div>
          ) : (
            <MessageRow
              key={it.m.id}
              m={it.m}
              hit={it.m.id === highlightId}
              first={it.first}
              last={it.last}
              tail={it.tail}
              grouped={grouped}
              showName={conversation.kind !== 'direct' && it.m.senderId !== ME && it.tail}
              timeShown={!grouped || shownTimes.has(it.m.id)}
              onTap={() => {
                if (it.m.status === 'failed') setActionFor(it.m)
                else if (grouped) setShownTimes((s) => { const n = new Set(s); if (n.has(it.m.id)) n.delete(it.m.id); else n.add(it.m.id); return n })
              }}
              onPressStart={() => startPress(it.m)}
              onPressEnd={endPress}
              onMenu={() => actionable(it.m) && setActionFor(it.m)}
            />
          ),
        )}
      </div>

      {conversation.left ? (
        <p className="composer composer--left" role="status">You left this group. You can read the chat, but you can't send or get new messages.</p>
      ) : (
      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <button type="button" className="composer__attach" aria-label="Attach a photo or document" onClick={() => setAttaching(true)}><IconAttach size={22} /></button>
        <textarea
          rows={1}
          value={draft}
          placeholder="Message"
          aria-label={`Message ${conversation.title}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`
          }}
        />
        <button type="submit" className="composer__send" disabled={!draft.trim()} aria-label="Send message"><IconSend size={20} /></button>
      </form>
      )}

      {attaching && <AttachSheet onClose={() => setAttaching(false)} onSend={(d) => void send(d)} />}

      {actionFor && (
        <BottomSheet title={actionFor.status === 'failed' ? 'Message not sent' : 'Message'} onClose={() => setActionFor(null)}>
          <div className="stack">
            {actionFor.status === 'failed' ? (
              <>
                <Banner kind="error">This message didn't send. Nothing was delivered.</Banner>
                <Button onClick={() => { const m = actionFor; setActionFor(null); track('message_retried', { conversation_id: id }); void send(drafts.current.get(m.id) ?? { text: m.text }, m.id) }}>
                  <IconRetry size={18} /> Try sending again
                </Button>
                <Button variant="tertiary" onClick={() => void remove(actionFor)}>Discard message</Button>
              </>
            ) : (
              <Button variant="destructive" onClick={() => void remove(actionFor)}><IconTrash size={18} /> Delete message</Button>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

interface RowProps {
  m: Message
  hit: boolean
  first: boolean
  last: boolean
  tail: boolean
  grouped: boolean
  showName: boolean
  timeShown: boolean
  onTap: () => void
  onPressStart: () => void
  onPressEnd: () => void
  onMenu: () => void
}

function MessageRow({ m, hit, first, last, tail, grouped, showName, timeShown, onTap, onPressStart, onPressEnd, onMenu }: RowProps) {
  const mine = m.senderId === ME
  const failed = m.status === 'failed'
  const time = messageTime(m.at)
  const a = m.attachment
  const bareImage = a?.kind === 'image' && !m.text
  const showFoot = !failed && (timeShown || m.status === 'sending' || (bareImage && !a?.expired))
  const label = failed ? 'Not sent. Tap to retry' : m.status === 'sending' ? 'Sending' : time
  const cls = ['msg', hit && 'msg--hit', mine && 'msg--mine', tail && 'msg--tail', grouped && !first && 'msg--joined', grouped && !last && 'msg--open'].filter(Boolean).join(' ')
  return (
    <div className={cls} data-mid={m.id}>
      <div
        className={`bubble${bareImage ? ' bubble--media' : ''}${a ? ' bubble--file' : ''}${failed ? ' bubble--failed' : ''}${m.status === 'sending' ? ' bubble--sending' : ''}${showFoot ? ' bubble--timed' : ''}${mine ? ' bubble--mine' : ''}`}
        role={a ? 'group' : 'button'}
        tabIndex={a ? undefined : 0}
        aria-label={`${mine ? 'You' : m.senderName}: ${m.text || a?.name || ''}. ${label}`}
        onClick={onTap}
        onKeyDown={(e) => { if (e.key === 'Enter') onTap(); if (e.key === 'ContextMenu') onMenu() }}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        onPointerCancel={onPressEnd}
        onContextMenu={(e) => { e.preventDefault(); onMenu() }}
      >
        {showName && <span className="bubble__name" style={{ color: `var(--sender-${toneFor(m.senderName)})` }}>{m.senderName}{m.senderTitle && <span className="bubble__tag">{m.senderTitle}</span>}</span>}
        {a && <MessageAttachment message={m} mine={mine} />}
        {m.text && <span className="bubble__text">{m.text}</span>}
        {showFoot && (
          <span className="bubble__foot">
            {time}
            {mine && (m.status === 'sending' ? <IconClock size={14} /> : <span className="ticks"><IconDoubleTick size={16} /></span>)}
          </span>
        )}
      </div>
      {failed && <span className="msg__meta msg__meta--failed">{label}</span>}
    </div>
  )
}
