import { useState } from 'react'
import { api } from '../../data'
import type { CalendarEvent, CalendarInfo } from '../../data/types'
import { Avatar, BottomSheet, Button, Skeleton } from '../../design/ui'
import { IconCheck, IconChevronRight, IconClock } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { dayLabel, eventTime } from './dates'

export function EventSheet({ event, calendar, onClose }: { event: CalendarEvent; calendar?: CalendarInfo; onClose: () => void }) {
  return (
    <BottomSheet title={event.title} onClose={onClose}>
      <div className="stack">
        {calendar && <span className="chip chip--static cal-chip" style={{ ['--cal' as string]: `var(--sender-${calendar.tone})`, ['--cal-bg' as string]: `var(--tone-${calendar.tone}-bg)` }}>{calendar.name}</span>}
        <p className="t-body"><strong>{dayLabel(new Date(event.start))}</strong></p>
        <p className="t-body-sm muted row-flex" style={{ gap: 'var(--s-3)' }}><IconClock size={18} /> {eventTime(event)}</p>
        {event.location && <p className="t-body-sm"><span className="muted">Where: </span>{event.location}</p>}
        {event.description && <p className="t-body-sm">{event.description}</p>}
      </div>
    </BottomSheet>
  )
}

/** CAL-02: choose exactly who has one calendar. */
function AssignSheet({ calendar, onClose, onSaved }: { calendar: CalendarInfo; onClose: () => void; onSaved: () => void }) {
  const people = useAsync(() => api.calendar.assignees(calendar.id), [calendar.id])
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const { busy, error, run } = useSubmit()
  const current = picked ?? (people.status === 'ready' ? new Set(people.data.filter((p) => p.assigned).map((p) => p.id)) : new Set<string>())
  const toggle = (id: string) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }
  return (
    <BottomSheet title={`Who has ${calendar.name}?`} onClose={onClose}>
      {people.status === 'loading' && <div aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="list-row"><Skeleton width={40} height={40} radius="50%" /><Skeleton width="50%" height={14} /></div>)}</div>}
      {people.status === 'error' && <ErrorBanner error={people.error} onRetry={people.reload} />}
      {people.status === 'ready' && (
        <div className="stack">
          {error != null && <ErrorBanner error={error} />}
          <ul className="people" role="list" style={{ maxHeight: '46dvh', overflowY: 'auto' }}>
            {people.data.map((p) => {
              const on = current.has(p.id)
              return (
                <li key={p.id}>
                  <button type="button" className="list-row" role="checkbox" aria-checked={on} onClick={() => toggle(p.id)}>
                    <Avatar name={p.name} size={40} />
                    <span className="people__text">
                      <span className="t-title-sm people__name">{p.name}</span>
                      {p.jobTitle && <span className="t-caption muted">{p.jobTitle}</span>}
                    </span>
                    <span className={`check${on ? ' is-on' : ''}`} aria-hidden="true">{on && <IconCheck size={16} />}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Button loading={busy} disabled={picked === null} onClick={async () => {
            if (await run(() => api.calendar.assign(calendar.id, [...current]))) { track('calendar_assigned', { count: current.size }); onSaved() }
          }}>Save ({current.size} {current.size === 1 ? 'person' : 'people'})</Button>
        </div>
      )}
    </BottomSheet>
  )
}

/** Admin: the list of calendars and who each one is assigned to. */
export function ManageSheet({ calendars, onClose, onChanged }: { calendars: CalendarInfo[]; onClose: () => void; onChanged: () => void }) {
  const [editing, setEditing] = useState<CalendarInfo | null>(null)
  return (
    <>
      <BottomSheet title="Calendars" onClose={onClose}>
        <p className="t-body-sm muted" style={{ marginBottom: 'var(--s-4)' }}>Choose who sees each calendar. People only see events from calendars assigned to them.</p>
        <div className="card">
          {calendars.map((c) => (
            <button key={c.id} type="button" className="list-row" onClick={() => setEditing(c)}>
              <span className="cal-dot" style={{ background: `var(--sender-${c.tone})` }} aria-hidden="true" />
              <span className="people__text">
                <span className="t-title-sm people__name">{c.name}</span>
                <span className="t-caption muted">{c.assignedCount} {c.assignedCount === 1 ? 'person' : 'people'} · {c.description}</span>
              </span>
              <IconChevronRight size={20} />
            </button>
          ))}
        </div>
      </BottomSheet>
      {editing && <AssignSheet calendar={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged() }} />}
    </>
  )
}
