import { useMemo, useRef, useState, type ReactNode } from 'react'
import { haptic } from '../../design/haptics'
import { Avatar, Badge, BottomSheet, Button, Skeleton, useOnline } from '../../design/ui'
import { IconBell, IconDoubleTick, IconMegaphone, IconMute, IconPeople, IconSearch, IconUnread } from '../../design/icons'
import { api } from '../../data'
import { useMedia } from '../../state/useMedia'
import { useFlip } from '../../design/useFlip'
import { useSlide } from '../../design/useSlide'
import { SwipeRow } from './SwipeRow'
import { ErrorBanner } from '../auth/AuthFrame'
import { Banner } from '../../design/ui'
import type { Conversation } from '../../data/types'
import { AdRow } from '../ads/AdSlot'
import { LIMITS } from '../../config/limits'
import { SearchPanel } from '../search/SearchPanel'
import { listTime } from './format'

type Filter = 'all' | 'unread' | 'groups' | 'direct'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
  { id: 'direct', label: 'Direct' },
]

const isGroupish = (c: Conversation) => c.kind !== 'direct'

function preview(c: Conversation): string {
  if (!c.lastMessage) return 'No messages yet'
  // My own last message shows delivery ticks instead of a name.
  return c.lastSender === 'You' ? c.lastMessage.replace(/^You: /, '') : c.lastMessage
}

const isUnread = (c: Conversation) => c.unread > 0 || Boolean(c.flaggedUnread)

function Row({ c, active, onOpen, onActions }: { c: Conversation; active: boolean; onOpen: (id: string, messageId?: string) => void; onActions: (c: Conversation) => void }) {
  // A long press (touch) or a right click opens the same actions the swipe does.
  const timer = useRef<number>(undefined)
  const fired = useRef(false)
  const at = useRef({ x: 0, y: 0 })
  const unread = isUnread(c)
  return (
    <button
      type="button"
      className={`chat-row${active ? ' chat-row--active' : ''}`}
      onClick={(e) => { if (fired.current) { fired.current = false; e.preventDefault(); return } onOpen(c.id) }}
      onContextMenu={(e) => { e.preventDefault(); onActions(c) }}
      onTouchStart={(e) => {
        fired.current = false
        at.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => { fired.current = true; haptic('light'); onActions(c) }, 500)
      }}
      onTouchMove={(e) => { if (Math.hypot(e.touches[0].clientX - at.current.x, e.touches[0].clientY - at.current.y) > 8) window.clearTimeout(timer.current) }}
      onTouchEnd={() => window.clearTimeout(timer.current)}
      onTouchCancel={() => window.clearTimeout(timer.current)}
      aria-current={active ? 'page' : undefined}
    >
      <Avatar
        name={c.title}
        size={56}
        presence={c.kind === 'direct' ? c.presence : undefined}
        icon={c.kind === 'general' ? <IconMegaphone size={22} /> : undefined}
        tone={c.kind === 'general' ? 0 : undefined}
      />
      <span className="chat-row__main">
        <span className="chat-row__top">
          <span className={`chat-row__title${unread ? ' is-unread' : ''}`}>{c.title}</span>
          {c.muted && <span className="chat-row__muted" role="img" aria-label="Muted"><IconMute size={14} /></span>}
          <span className="chat-row__time">{listTime(c.lastAt)}</span>
        </span>
        {c.parent && <span className="chat-row__parent">in {c.parent}</span>}
        <span className="chat-row__bottom">
          <span className={`chat-row__preview${unread ? ' is-unread' : ''}`}>
            {c.lastSender === 'You' && c.lastMessage && <span className="ticks" aria-label="Delivered"><IconDoubleTick size={18} /></span>}
            {preview(c)}
          </span>
          <Badge count={c.unread} dot={Boolean(c.flaggedUnread)} muted={c.kind === 'general' || Boolean(c.muted)} />
        </span>
      </span>
    </button>
  )
}

export interface ChatListProps {
  state: { status: 'loading' | 'ready' | 'error'; data?: Conversation[]; error?: unknown }
  activeId?: string
  onOpen: (id: string, messageId?: string) => void
  onRetry: () => void
  onNewChat: () => void
  /** Rendered beside the search field (the new chat button). */
  action?: ReactNode
  /** In-app notice shown under the search field (NTF-01). */
  banner?: ReactNode
}

export function ChatList({ state, activeId, onOpen, onRetry, onNewChat, action, banner }: ChatListProps) {
  const online = useOnline()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [actionsFor, setActionsFor] = useState<Conversation | null>(null)
  const [actionError, setActionError] = useState<unknown>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  useSlide(chipsRef, `${filter}|${state.status}|${(state.data ?? []).length}`)
  const touch = useMedia('(pointer: coarse)')
  const swipe = touch

  const toggleUnread = (c: Conversation) => { setActionError(null); void (isUnread(c) ? api.chat.markRead(c.id) : api.chat.markUnread(c.id)).catch(setActionError) }
  const toggleMute = (c: Conversation) => { setActionError(null); void api.chat.setMuted(c.id, !c.muted).catch(setActionError) }

  const all = state.data ?? []
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      if (q && !`${c.title} ${c.lastMessage}`.toLowerCase().includes(q)) return false
      if (filter === 'unread') return isUnread(c)
      if (filter === 'groups') return isGroupish(c)
      if (filter === 'direct') return c.kind === 'direct'
      return true
    })
  }, [all, query, filter])

  const searching = query.trim().length >= 2 && state.status === 'ready'
  const pinned = !query && filter === 'all' ? shown.find((c) => c.kind === 'general') : undefined
  const rest = pinned ? shown.filter((c) => c.id !== pinned.id) : shown
  useFlip(listRef, rest.map((c) => c.id).join())

  return (
    <div className="chat-list">
      {!online && <div style={{ padding: 'var(--s-3) var(--gutter)' }}><Banner kind="offline" title="You're offline">Messages will send when you're back online.</Banner></div>}

      <div className="searchrow">
        <div className="search">
          <IconSearch size={20} />
          <input type="search" placeholder="Search chats" aria-label="Search chats" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {action}
      </div>

      {!searching && banner}

      {searching && <SearchPanel query={query} conversations={all} onOpen={onOpen} />}

      {!searching && state.status === 'ready' && all.length > 0 && (
        <div className="chips" role="group" aria-label="Filter chats" ref={chipsRef} data-slide>
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => { haptic('selection'); setFilter(f.id) }}>
              {f.label}
              {f.id === 'unread' && all.some((c) => c.unread) && <span className="chip__count">{all.filter((c) => c.unread).length}</span>}
            </button>
          ))}
        </div>
      )}

      {state.status === 'loading' && (
        <div aria-busy="true" aria-label="Loading chats">
          {Array.from({ length: 7 }, (_, i) => (
            <div className="chat-row" key={i}>
              <Skeleton width={48} height={48} radius="50%" />
              <span className="chat-row__main" style={{ gap: 8 }}>
                <Skeleton width={`${50 + ((i * 17) % 35)}%`} height={14} />
                <Skeleton width={`${70 + ((i * 11) % 25)}%`} height={12} />
              </span>
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div style={{ padding: 'var(--s-5) var(--gutter)' }}>
          <ErrorBanner error={state.error} onRetry={onRetry} />
        </div>
      )}

      {state.status === 'ready' && all.length === 0 && (
        <div className="empty">
          <span className="empty__icon"><IconPeople size={40} /></span>
          <h2 className="t-title">No conversations yet</h2>
          <p className="t-body-sm muted">Start a chat with someone on your team and it will show up here.</p>
          <Button block={false} onClick={onNewChat}>Start a chat</Button>
        </div>
      )}

      {!searching && state.status === 'ready' && all.length > 0 && shown.length === 0 && (
        <div className="empty">
          <h2 className="t-title">{query ? `No chats match “${query.trim()}”` : filter === 'unread' ? "You're all caught up" : 'Nothing here'}</h2>
          {(query || filter !== 'all') && (
            <Button variant="secondary" block={false} onClick={() => { setQuery(''); setFilter('all') }}>Clear search and filters</Button>
          )}
        </div>
      )}

      {!searching && state.status === 'ready' && shown.length > 0 && (
        <>
          {pinned && (
            <button type="button" className="pinned" onClick={() => onOpen(pinned.id)}>
              <Avatar name={pinned.title} tone={0} icon={<IconMegaphone size={22} />} />
              <span className="chat-row__main">
                <span className="chat-row__top">
                  <span className="chat-row__title is-unread">{pinned.title}</span>
                  <span className="chat-row__time">{listTime(pinned.lastAt)}</span>
                </span>
                <span className="chat-row__bottom">
                  <span className="chat-row__preview chat-row__preview--1">{pinned.lastMessage}</span>
                  <Badge count={pinned.unread} muted />
                </span>
              </span>
            </button>
          )}
          <div role="list" ref={listRef}>
            {rest.map((c, i) => (
              <div role="listitem" key={c.id} data-flip-id={c.id}>
                <SwipeRow
                  enabled={swipe}
                  lead={{ label: isUnread(c) ? 'Read' : 'Unread', icon: <IconUnread size={22} />, run: () => toggleUnread(c) }}
                  trail={{ label: c.muted ? 'Unmute' : 'Mute', icon: c.muted ? <IconBell size={22} /> : <IconMute size={22} />, run: () => toggleMute(c) }}
                >
                  <Row c={c} active={c.id === activeId} onOpen={onOpen} onActions={setActionsFor} />
                </SwipeRow>
                {i === LIMITS.adAfterChats - 1 && <AdRow />}
              </div>
            ))}
          </div>
        </>
      )}
      {actionError != null && <div style={{ padding: 'var(--s-3) var(--gutter)' }}><ErrorBanner error={actionError} /></div>}
      {actionsFor && (
        <BottomSheet title={actionsFor.title} onClose={() => setActionsFor(null)}>
          <div className="stack">
            <Button variant="secondary" onClick={() => { toggleUnread(actionsFor); setActionsFor(null) }}>
              <IconUnread size={18} /> {isUnread(actionsFor) ? 'Mark as read' : 'Mark as unread'}
            </Button>
            <Button variant="secondary" onClick={() => { toggleMute(actionsFor); setActionsFor(null) }}>
              {actionsFor.muted ? <><IconBell size={18} /> Unmute notifications</> : <><IconMute size={18} /> Mute notifications</>}
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
