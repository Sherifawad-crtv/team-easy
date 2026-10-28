import { useMemo, useState, type ReactNode } from 'react'
import { Avatar, Badge, Button, Skeleton, useOnline } from '../../design/ui'
import { IconDoubleTick, IconMegaphone, IconPeople, IconSearch } from '../../design/icons'
import { ErrorBanner } from '../auth/AuthFrame'
import { Banner } from '../../design/ui'
import type { Conversation } from '../../data/types'
import { useVariant } from '../../experiments/experiments'
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

function Row({ c, active, onOpen, lines }: { c: Conversation; active: boolean; onOpen: (id: string) => void; lines: 1 | 2 }) {
  return (
    <button type="button" className={`chat-row${active ? ' chat-row--active' : ''}`} onClick={() => onOpen(c.id)} aria-current={active ? 'page' : undefined}>
      <Avatar
        name={c.title}
        size={56}
                presence={c.kind === 'direct' ? c.presence : undefined}
        icon={c.kind === 'general' ? <IconMegaphone size={22} /> : undefined}
        tone={c.kind === "general" ? 0 : undefined}
      />
      <span className="chat-row__main">
        <span className="chat-row__top">
          <span className={`chat-row__title${c.unread ? ' is-unread' : ''}`}>{c.title}</span>
          <span className="chat-row__time">{listTime(c.lastAt)}</span>
        </span>
        {c.parent && <span className="chat-row__parent">in {c.parent}</span>}
        <span className="chat-row__bottom">
          <span className={`chat-row__preview chat-row__preview--${lines}${c.unread ? ' is-unread' : ''}`}>
            {c.lastSender === 'You' && c.lastMessage && <span className="ticks" aria-label="Delivered"><IconDoubleTick size={18} /></span>}
            {preview(c)}
          </span>
          <Badge count={c.unread} muted={c.kind === 'general'} />
        </span>
      </span>
    </button>
  )
}

export interface ChatListProps {
  state: { status: 'loading' | 'ready' | 'error'; data?: Conversation[]; error?: unknown }
  activeId?: string
  onOpen: (id: string) => void
  onRetry: () => void
  onNewChat: () => void
  /** Rendered beside the search field (the new chat button). */
  action?: ReactNode
}

export function ChatList({ state, activeId, onOpen, onRetry, onNewChat, action }: ChatListProps) {
  const variant = useVariant('chat_list')
  const online = useOnline()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const all = state.data ?? []
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      if (q && !`${c.title} ${c.lastMessage}`.toLowerCase().includes(q)) return false
      if (variant === 'B') {
        if (filter === 'unread') return c.unread > 0
        if (filter === 'groups') return isGroupish(c)
        if (filter === 'direct') return c.kind === 'direct'
      }
      return true
    })
  }, [all, query, filter, variant])

  const pinned = variant === 'B' && !query && filter === 'all' ? shown.find((c) => c.kind === 'general') : undefined
  const rest = pinned ? shown.filter((c) => c.id !== pinned.id) : shown
  const lines = variant === 'B' ? 1 : 2

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

      {variant === 'B' && state.status === 'ready' && all.length > 0 && (
        <div className="chips" role="group" aria-label="Filter chats">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
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

      {state.status === 'ready' && all.length > 0 && shown.length === 0 && (
        <div className="empty">
          <h2 className="t-title">{query ? `No chats match “${query.trim()}”` : filter === 'unread' ? "You're all caught up" : 'Nothing here'}</h2>
          {(query || filter !== 'all') && (
            <Button variant="secondary" block={false} onClick={() => { setQuery(''); setFilter('all') }}>Clear search and filters</Button>
          )}
        </div>
      )}

      {state.status === 'ready' && shown.length > 0 && (
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
          <div role="list">
            {rest.map((c) => (
              <div role="listitem" key={c.id}>
                <Row c={c} active={c.id === activeId} onOpen={onOpen} lines={lines} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
