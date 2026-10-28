import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../../data'
import type { Conversation, MessageHit, SearchDate, SearchFilters, SearchType } from '../../data/types'
import { formatBytes } from '../../config/limits'
import { Avatar, BottomSheet, Skeleton } from '../../design/ui'
import { IconCamera } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'
import { listTime } from '../chat/format'
import { DocIcon, fileExt } from '../media/MessageAttachment'
import { snippet } from './snippet'

const DATES: { id: SearchDate; label: string }[] = [
  { id: 'any', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Past 7 days' },
  { id: 'month', label: 'Past 30 days' },
]
const TYPES: { id: SearchType; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'images', label: 'Photos' },
  { id: 'documents', label: 'Documents' },
]

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {snippet(text, query).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="results-sec">
      <h2 className="results-sec__title">{title}</h2>
      {children}
    </section>
  )
}

function Picker<T extends string>({ title, options, value, onPick, onClose }: { title: string; options: { id: T; label: string }[]; value: T; onPick: (v: T) => void; onClose: () => void }) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="card" role="radiogroup" aria-label={title}>
        {options.map((o) => (
          <button key={o.id} type="button" className="radio-row" role="radio" aria-checked={value === o.id} onClick={() => { onPick(o.id); onClose() }}>
            <span className="radio-dot" />
            <span className="t-title-sm">{o.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

/** Search results for chats, messages and documents with filters (SRC-02..04). */
export function SearchPanel({ query, conversations, onOpen }: { query: string; conversations: Conversation[]; onOpen: (conversationId: string, messageId?: string) => void }) {
  const [debounced, setDebounced] = useState(query)
  const [filters, setFilters] = useState<SearchFilters>({ date: 'any', type: 'all' })
  const [picker, setPicker] = useState<'date' | 'type' | 'in' | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const results = useAsync(() => api.chat.search(debounced, filters), [debounced, filters.date, filters.type, filters.conversationId])
  useEffect(() => {
    if (results.status === 'ready') {
      const n = results.data.chats.length + results.data.messages.length + results.data.documents.length
      track('search_run', { results: n, date: filters.date, type: filters.type, in_chat: Boolean(filters.conversationId) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.status])

  const inChat = conversations.find((c) => c.id === filters.conversationId)
  const active = { date: filters.date !== 'any', type: filters.type !== 'all', in: Boolean(inChat) }

  const total = results.status === 'ready' ? results.data.chats.length + results.data.messages.length + results.data.documents.length : 0

  const hitRow = (h: MessageHit, kind: 'message' | 'document') => {
    const a = h.message.attachment
    return (
      <button key={h.message.id} type="button" className="hit" onClick={() => { track('search_result_opened', { kind }); onOpen(h.conversation.id, h.message.id) }}>
        {kind === 'document' && a ? (
          <DocIcon name={a.name} />
        ) : a ? (
          <span className="doc-icon doc-icon--img" aria-hidden="true"><IconCamera size={20} /></span>
        ) : (
          <Avatar name={h.conversation.title} size={40} icon={undefined} />
        )}
        <span className="hit__main">
          <span className="hit__top">
            <span className="hit__title">{kind === 'document' && a ? <Marked text={a.name} query={debounced} /> : h.conversation.title}</span>
            <span className="hit__time">{listTime(h.message.at)}</span>
          </span>
          <span className="hit__text">
            {kind === 'document' && a ? (
              `${fileExt(a.name).toUpperCase()} · ${formatBytes(a.size)} · in ${h.conversation.title}`
            ) : a ? (
              <>
                {`Photo · in ${h.conversation.title}`}
                {h.message.text && <> · <Marked text={h.message.text} query={debounced} /></>}
              </>
            ) : (
              <Marked text={h.message.text} query={debounced} />
            )}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="searchpanel">
      <div className="chips" role="group" aria-label="Search filters">
        <button type="button" className="chip" aria-pressed={active.date} onClick={() => setPicker('date')}>{DATES.find((d) => d.id === filters.date)!.label}</button>
        <button type="button" className="chip" aria-pressed={active.in} onClick={() => setPicker('in')}>{inChat ? `In ${inChat.title}` : 'Any chat'}</button>
        <button type="button" className="chip" aria-pressed={active.type} onClick={() => setPicker('type')}>{TYPES.find((d) => d.id === filters.type)!.label}</button>
      </div>

      {results.status === 'loading' && (
        <div aria-busy="true" aria-label="Searching">
          {[0, 1, 2, 3].map((i) => (
            <div className="hit" key={i}><Skeleton width={40} height={40} radius="50%" /><span className="hit__main" style={{ gap: 8 }}><Skeleton width="45%" height={14} /><Skeleton width="80%" height={12} /></span></div>
          ))}
        </div>
      )}
      {results.status === 'error' && <div style={{ padding: 'var(--s-4) var(--gutter)' }}><ErrorBanner error={results.error} onRetry={results.reload} /></div>}

      {results.status === 'ready' && total === 0 && (
        <div className="empty">
          <h2 className="t-title">{`Nothing found for “${debounced.trim()}”`}</h2>
          <p className="t-body-sm muted">Check the spelling, or widen the filters above.</p>
        </div>
      )}

      {results.status === 'ready' && total > 0 && (
        <>
          {results.data.chats.length > 0 && (
            <Section title="Chats">
              {results.data.chats.map((c) => (
                <button key={c.id} type="button" className="hit" onClick={() => onOpen(c.id)}>
                  <Avatar name={c.title} size={40} presence={c.kind === 'direct' ? c.presence : undefined} />
                  <span className="hit__main"><span className="hit__title"><Marked text={c.title} query={debounced} /></span></span>
                </button>
              ))}
            </Section>
          )}
          {results.data.messages.length > 0 && <Section title={filters.type === 'images' ? 'Photos' : 'Messages'}>{results.data.messages.map((h) => hitRow(h, 'message'))}</Section>}
          {results.data.documents.length > 0 && <Section title="Documents">{results.data.documents.map((h) => hitRow(h, 'document'))}</Section>}
        </>
      )}

      {picker === 'date' && <Picker title="Date" options={DATES} value={filters.date} onPick={(date) => setFilters((f) => ({ ...f, date }))} onClose={() => setPicker(null)} />}
      {picker === 'type' && <Picker title="Type" options={TYPES} value={filters.type} onPick={(type) => setFilters((f) => ({ ...f, type }))} onClose={() => setPicker(null)} />}
      {picker === 'in' && (
        <Picker
          title="Search in"
          options={[{ id: '', label: 'Any chat' }, ...conversations.map((c) => ({ id: c.id, label: c.title }))]}
          value={filters.conversationId ?? ''}
          onPick={(id) => setFilters((f) => ({ ...f, conversationId: id || undefined }))}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
