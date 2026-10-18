import { useEffect, useState } from 'react'
import { api } from '../../data'
import { Avatar, BottomSheet, Skeleton } from '../../design/ui'
import { IconSearch } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { ErrorBanner } from '../auth/AuthFrame'
import type { Conversation } from '../../data/types'

/** Start a 1-to-1 chat by searching members by name (CHT-01, SRC-01). */
export function NewChatSheet({ onClose, onOpened }: { onClose: () => void; onOpened: (c: Conversation) => void }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [starting, setStarting] = useState<string | null>(null)
  const [failed, setFailed] = useState<unknown>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(t)
  }, [query])

  const results = useAsync(() => api.chat.searchMembers(debounced), [debounced])

  const start = async (memberId: string) => {
    setStarting(memberId)
    setFailed(null)
    try {
      const conv = await api.chat.openDirect(memberId)
      track('new_chat_started', { existing: Boolean(conv.lastMessage) })
      onOpened(conv)
    } catch (e) {
      setFailed(e)
      setStarting(null)
    }
  }

  return (
    <BottomSheet title="New chat" onClose={onClose}>
      <div className="search" style={{ margin: '0 0 var(--s-4)' }}>
        <IconSearch size={20} />
        <input type="search" autoFocus placeholder="Search people by name" aria-label="Search people by name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {failed != null && <div style={{ marginBottom: 'var(--s-4)' }}><ErrorBanner error={failed} /></div>}
      {results.status === 'loading' && (
        <div aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="list-row"><Skeleton width={40} height={40} radius="50%" /><Skeleton width="55%" height={14} /></div>
          ))}
        </div>
      )}
      {results.status === 'error' && <ErrorBanner error={results.error} onRetry={results.reload} />}
      {results.status === 'ready' && results.data.length === 0 && (
        <p className="t-body-sm muted" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          {debounced ? `No one matches “${debounced}”` : 'No people to show yet'}
        </p>
      )}
      {results.status === 'ready' && (
        <ul className="people" role="list">
          {results.data.map((p) => (
            <li key={p.id}>
              <button type="button" className="list-row" disabled={starting !== null} onClick={() => void start(p.id)} aria-busy={starting === p.id || undefined}>
                <Avatar name={p.name} size={40} presence={p.presence} />
                <span className="people__text">
                  <span className="t-title-sm people__name">{p.name}</span>
                  {p.jobTitle && <span className="t-caption muted">{p.jobTitle}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
