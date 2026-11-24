import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { haptic } from '../../design/haptics'
import type { Conversation as Conv, Message, MessageDraft } from '../../data/types'
import { Avatar, BackButton, Banner, BottomSheet, Button, Overlay, Skeleton, toneFor } from '../../design/ui'
import { IconAttach, IconClock, IconDoubleTick, IconMegaphone, IconRetry, IconSend, IconTrash } from '../../design/icons'
import { track } from '../../analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { useMedia } from '../../state/useMedia'
import { MessageMenu } from './MessageMenu'
import { ContactSheet } from './ContactSheet'
import { ReportSheet } from '../safety/ReportSheet'
import { AdBanner } from '../ads/AdSlot'
import { CallButtons } from '../calls/CallButtons'
import { AttachSheet } from '../media/AttachSheet'
import { MessageAttachment } from '../media/MessageAttachment'
import { dayLabel, messageTime, sameDay } from './format'

const ME = 'me'
const GROUP_GAP = 5 * 60_000
let tmpSeq = 0

type Item =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; m: Message; tail: boolean }

function buildItems(messages: Message[]): Item[] {
  const items: Item[] = []
  messages.forEach((m, i) => {
    const prev = messages[i - 1]
    if (!prev || !sameDay(prev.at, m.at)) items.push({ kind: 'day', key: `d-${m.id}`, label: dayLabel(m.at) })
    // The bubble tail marks the start of a run from one person.
    const tail = !(prev && sameDay(prev.at, m.at) && prev.senderId === m.senderId && m.at - prev.at < GROUP_GAP)
    items.push({ kind: 'msg', m, tail })
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
  const isDirect = conversation.kind === 'direct'

  const history = useAsync(() => api.chat.listMessages(id), [id])
  const { patch } = history
  const [draft, setDraft] = useState('')
  const [actionFor, setActionFor] = useState<Message | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [reporting, setReporting] = useState<Message | null>(null)
  const unblock = useSubmit()
  const [attaching, setAttaching] = useState(false)
  const drafts = useRef(new Map<string, MessageDraft>())
  const scrollRef = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const pressTimer = useRef<number>(0)
  // On touch screens a long press lifts the message into a menu.
  const ios = useMedia('(pointer: coarse)')
  const [menu, setMenu] = useState<{ m: Message; bubble: HTMLElement } | null>(null)
  const [popId, setPopId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (history.status === 'ready') {
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
      haptic('light')
      try {
        const saved = await api.chat.sendMessage(id, draft)
        seen.current?.add(saved.id)
        setPopId(saved.id)
        window.setTimeout(() => setPopId(null), 900)
        patch((prev) => prev.map((m) => (m.id === tmpId ? saved : m)))
        drafts.current.delete(tmpId)
        track('message_sent', { conversation_id: id, kind: conversation.kind, retry: Boolean(retryId), attachment: file ? (file.type.startsWith('image/') ? 'image' : 'document') : null })
      } catch {
        patch((prev) => prev.map((m) => (m.id === tmpId ? { ...m, status: 'failed' as const } : m)))
        haptic('error')
        track('message_failed', { conversation_id: id })
      }
    },
    [id, conversation.kind, patch],
  )

  // The message field grows and shrinks with what is typed, smoothly in motion style B.
  useLayoutEffect(() => {
    const el = composer.current
    if (!el) return
    const was = el.offsetHeight
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, 120)
    if (was > 0 && was !== next) {
      el.style.height = `${was}px`
      void el.offsetHeight
    }
    el.style.height = `${next}px`
  }, [draft])

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
      haptic('warning')
      track('message_deleted', { conversation_id: id })
    } catch {
      history.reload()
    }
  }

  // Remember which messages were there on arrival, so only later ones animate in.
  if (history.status === 'ready' && seen.current === null) seen.current = new Set(history.data.map((m) => m.id))
  useEffect(() => {
    if (history.status === 'ready') for (const m of history.data) seen.current?.add(m.id)
  }, [history])

  const items = useMemo(() => (history.status === 'ready' ? buildItems(history.data) : []), [history])

  const actionable = (m: Message) => m.status === 'failed' || (isDirect && m.senderId === ME && m.status === 'sent')
  // On phones in motion style B every message with text can be copied, so every one has a menu.
  // Every message from someone else can be reported, so it always has a menu.
  const hasMenu = (m: Message) => actionable(m) || (ios && (Boolean(m.text) || m.senderId !== ME))
  const openMenu = (m: Message, el: HTMLElement) => (ios ? setMenu({ m, bubble: el }) : setActionFor(m))
  const startPress = (m: Message, el: HTMLElement) => {
    if (!hasMenu(m)) return
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => openMenu(m, el), 450)
  }
  const copyText = (m: Message) => {
    const say = (text: string) => { setToast(text); window.setTimeout(() => setToast(null), 1600) }
    const fallback = () => {
      // Older browsers and pages without clipboard permission: copy through a hidden text field.
      const field = document.createElement('textarea')
      field.value = m.text
      field.style.cssText = 'position:fixed;left:-1000px;top:0;opacity:0'
      document.body.appendChild(field)
      field.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { /* not allowed */ }
      field.remove()
      say(ok ? 'Copied' : "Couldn't copy")
    }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(m.text).then(() => say('Copied'), fallback)
    else fallback()
  }
  const endPress = () => window.clearTimeout(pressTimer.current)

  return (
    <div className="convo">
      <header className="convo__bar">
        <span className="convo__back"><BackButton onClick={onBack} label="Back to chats" animated={false} /></span>
        {conversation.groupId ? (
          <button type="button" className="convo__who convo__who--link" onClick={() => navigate(`/groups/${conversation.groupId}`, { state: { from: 'chat' } })} aria-label={`${conversation.title}, group info`}>
            <Avatar name={conversation.title} size={40} group icon={undefined} />
            <span className="convo__text">
              <span className="convo__title">{conversation.title}</span>
              <span className="convo__sub">{subtitle(conversation)}</span>
            </span>
          </button>
        ) : (
          <button type="button" className="convo__who convo__who--link" onClick={() => setContactOpen(true)} aria-label={`${conversation.title}, contact info`}>
            <Avatar name={conversation.title} size={40} group={conversation.kind !== 'direct'} presence={isDirect ? conversation.presence : undefined} icon={conversation.kind === 'general' ? <IconMegaphone size={20} /> : undefined} tone={conversation.kind === 'general' ? 0 : undefined} />
            <span className="convo__text">
              <span className="convo__title">{conversation.title}</span>
              <span className="convo__sub">{subtitle(conversation)}</span>
            </span>
          </button>
        )}
        <CallButtons conversation={conversation} />
      </header>
      {contactOpen && <ContactSheet conversation={conversation} onClose={() => setContactOpen(false)} />}
      <AdBanner />

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
              tail={it.tail}
              showName={conversation.kind !== 'direct' && it.m.senderId !== ME && it.tail}
              onTap={() => {
                if (it.m.status === 'failed') setActionFor(it.m)
              }}
              enter={Boolean(seen.current && !seen.current.has(it.m.id))}
              tickPop={popId === it.m.id}
              onPressStart={(el) => startPress(it.m, el)}
              onPressEnd={endPress}
              onMenu={(el) => hasMenu(it.m) && openMenu(it.m, el)}
            />
          ),
        )}
      </div>

      {conversation.blocked ? (
        <div className="composer composer--left composer--blocked" role="status">
          <span>You blocked {conversation.title}. Unblock to send messages or call.</span>
          <Button variant="secondary" block={false} loading={unblock.busy} onClick={() => void unblock.run(async () => { if (conversation.memberId) await api.safety.unblock(conversation.memberId) })}>Unblock</Button>
        </div>
      ) : conversation.left ? (
        <p className="composer composer--left" role="status">You left this group. You can read the chat, but you can't send or get new messages.</p>
      ) : (
      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <button type="button" className="composer__attach" aria-label="Attach a photo or document" onClick={() => setAttaching(true)}><IconAttach size={22} /></button>
        <textarea
          ref={composer}
          rows={1}
          value={draft}
          placeholder="Message"
          aria-label={`Message ${conversation.title}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
        />
        <button type="submit" className="composer__send" disabled={!draft.trim()} aria-label="Send message"><IconSend size={20} /></button>
      </form>
      )}

      {menu && (
        <MessageMenu
          message={menu.m}
          bubble={menu.bubble}
          onClose={() => setMenu(null)}
          actions={{
            copy: menu.m.text ? () => copyText(menu.m) : undefined,
            remove: menu.m.status === 'sent' && isDirect && menu.m.senderId === ME ? () => void remove(menu.m) : undefined,
            retry: menu.m.status === 'failed' ? () => { track('message_retried', { conversation_id: id }); void send(drafts.current.get(menu.m.id) ?? { text: menu.m.text }, menu.m.id) } : undefined,
            discard: menu.m.status === 'failed' ? () => void remove(menu.m) : undefined,
            report: menu.m.senderId !== ME ? () => setReporting(menu.m) : undefined,
          }}
        />
      )}
      {toast && <Overlay><div className="toast" role="status">{toast}</div></Overlay>}
      {reporting && <ReportSheet target={{ kind: 'message', conversationId: id, messageId: reporting.id, userId: reporting.senderId }} subject={reporting.senderName} canBlock onClose={() => setReporting(null)} />}
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
  tail: boolean
  showName: boolean
  onTap: () => void
  enter: boolean
  tickPop: boolean
  onPressStart: (el: HTMLElement) => void
  onPressEnd: () => void
  onMenu: (el: HTMLElement) => void
}

function MessageRow({ m, hit, tail, showName, enter, tickPop, onTap, onPressStart, onPressEnd, onMenu }: RowProps) {
  const mine = m.senderId === ME
  const failed = m.status === 'failed'
  const time = messageTime(m.at)
  const a = m.attachment
  const bareImage = a?.kind === 'image' && !m.text
  const showFoot = !failed
  const label = failed ? 'Not sent. Tap to retry' : m.status === 'sending' ? 'Sending' : time
  const cls = ['msg', enter && 'msg--enter', hit && 'msg--hit', mine && 'msg--mine', tail && 'msg--tail'].filter(Boolean).join(' ')
  return (
    <div className={cls} data-mid={m.id}>
      <div
        className={`bubble${bareImage ? ' bubble--media' : ''}${a ? ' bubble--file' : ''}${failed ? ' bubble--failed' : ''}${m.status === 'sending' ? ' bubble--sending' : ''}${showFoot ? ' bubble--timed' : ''}${mine ? ' bubble--mine' : ''}`}
        role={a ? 'group' : 'button'}
        tabIndex={a ? undefined : 0}
        aria-label={`${mine ? 'You' : m.senderName}: ${m.text || a?.name || ''}. ${label}`}
        onClick={onTap}
        onKeyDown={(e) => { if (e.key === 'Enter') onTap(); if (e.key === 'ContextMenu') onMenu(e.currentTarget) }}
        onPointerDown={(e) => onPressStart(e.currentTarget)}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        onPointerCancel={onPressEnd}
        onContextMenu={(e) => { e.preventDefault(); onMenu(e.currentTarget) }}
      >
        {showName && <span className="bubble__name" style={{ color: `var(--sender-${toneFor(m.senderName)})` }}>{m.senderName}{m.senderTitle && <span className="bubble__tag">{m.senderTitle}</span>}</span>}
        {a && <MessageAttachment message={m} mine={mine} />}
        {m.text && <span className="bubble__text">{m.text}</span>}
        {showFoot && (
          <span className="bubble__foot">
            {time}
            {mine && (m.status === 'sending' ? <IconClock size={14} /> : <span className={`ticks${tickPop ? ' tick-pop' : ''}`}><IconDoubleTick size={16} /></span>)}
          </span>
        )}
      </div>
      {failed && <span className="msg__meta msg__meta--failed">{label}</span>}
    </div>
  )
}
