import { useMemo, useState } from 'react'
import { api } from '../../data'
import type { CalendarEvent } from '../../data/types'
import { Banner, Button, Skeleton } from '../../design/ui'
import { IconChevronRight, IconBack, IconEdit } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { ErrorBanner } from '../auth/AuthFrame'
import { EventSheet, ManageSheet } from './CalendarSheets'
import { WEEKDAYS, addDays, dayLabel, eventTime, eventsOn, monthGrid, monthLabel, sameDay, startOfDay, startOfMonth } from './dates'

/** The built-in calendar (CAL-01): a month, and the events of the day you pick. */
export function CalendarScreen() {
  const role = useReviewRole()
  const today = startOfDay(new Date())
  const [month, setMonth] = useState(startOfMonth(today))
  const [day, setDay] = useState(today)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<CalendarEvent | null>(null)
  const [managing, setManaging] = useState(false)

  const grid = useMemo(() => monthGrid(month), [month])
  const cals = useAsync(() => api.calendar.calendars(), [role])
  const events = useAsync(() => api.calendar.events(grid[0].getTime(), addDays(grid[41], 1).getTime()), [grid[0].getTime(), role])

  const calendars = cals.status === 'ready' ? cals.data : []
  const toneOf = (id: string) => calendars.find((c) => c.id === id)?.tone ?? 0
  const shown = (events.status === 'ready' ? events.data : []).filter((e) => !hidden.has(e.calendarId))
  const agenda = eventsOn(shown, day)
  const admin = role === 'admin'

  const go = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    setDay(sameDay(startOfMonth(today), next) ? today : next)
    track('calendar_month_changed')
  }
  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <main className="page surface fade-in">
      <header className="bar">
        <h1 className="bar__title">Calendar</h1>
        <span className="row-flex" style={{ gap: 'var(--s-2)' }}>
          <Button variant="tertiary" block={false} onClick={() => { setMonth(startOfMonth(today)); setDay(today) }}>Today</Button>
          {admin && cals.status === 'ready' && (
            <button type="button" className="newchat" aria-label="Manage calendars" onClick={() => setManaging(true)}><IconEdit size={22} /></button>
          )}
        </span>
      </header>

      <div className="page__body stack-lg">
        {cals.status === 'error' && <ErrorBanner error={cals.error} onRetry={cals.reload} />}

        {cals.status === 'ready' && calendars.length === 0 && (
          <div className="empty">
            <h2 className="t-title">No calendar yet</h2>
            <p className="t-body-sm muted">An admin assigns calendars to people. Once one is assigned to you, its events show up here.</p>
          </div>
        )}

        {(cals.status === 'loading' || calendars.length > 0) && (
          <>
            <div className="chips" role="group" aria-label="Calendars">
              {cals.status === 'loading' && [0, 1, 2].map((i) => <Skeleton key={i} width={96} height={36} radius={999} />)}
              {calendars.map((c) => (
                <button key={c.id} type="button" className="chip" aria-pressed={!hidden.has(c.id)} onClick={() => toggle(c.id)}>
                  <span className="cal-dot" style={{ background: `var(--sender-${c.tone})` }} aria-hidden="true" />{c.name}{!c.assigned && <span className="chip__count">not yours</span>}
                </button>
              ))}
            </div>

            <section aria-label={monthLabel(month)}>
              <div className="cal-nav">
                <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => go(-1)}><IconBack size={22} /></button>
                <h2 className="t-title">{monthLabel(month)}</h2>
                <button type="button" className="icon-btn" aria-label="Next month" onClick={() => go(1)}><IconChevronRight size={22} /></button>
              </div>
              <div className="cal-grid" role="grid" aria-label={monthLabel(month)}>
                {WEEKDAYS.map((w) => <span key={w} className="cal-grid__head" role="columnheader">{w}</span>)}
                {grid.map((d) => {
                  const list = eventsOn(shown, d)
                  const tones = [...new Set(list.map((e) => toneOf(e.calendarId)))].slice(0, 3)
                  const other = d.getMonth() !== month.getMonth()
                  return (
                    <button key={d.getTime()} type="button" role="gridcell" aria-selected={sameDay(d, day)}
                      aria-label={`${dayLabel(d)}, ${list.length === 0 ? 'no events' : `${list.length} ${list.length === 1 ? 'event' : 'events'}`}`}
                      className={`cal-day${other ? ' is-other' : ''}${sameDay(d, today) ? ' is-today' : ''}${sameDay(d, day) ? ' is-selected' : ''}`}
                      onClick={() => { setDay(d); if (other) setMonth(startOfMonth(d)) }}>
                      <span className="cal-day__n">{d.getDate()}</span>
                      <span className="cal-day__dots" aria-hidden="true">{tones.map((t) => <i key={t} style={{ background: `var(--sender-${t})` }} />)}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section aria-label="Events" aria-live="polite">
              <h2 className="t-title-sm" style={{ marginBottom: 'var(--s-3)' }}>{sameDay(day, today) ? 'Today' : dayLabel(day)}</h2>
              {events.status === 'loading' && <div aria-busy="true" aria-label="Loading events"><Skeleton height={64} radius={16} /></div>}
              {events.status === 'error' && <ErrorBanner error={events.error} onRetry={events.reload} />}
              {events.status === 'ready' && agenda.length === 0 && <p className="t-body-sm muted">Nothing planned{hidden.size ? ' in the calendars you are showing' : ''}.</p>}
              {events.status === 'ready' && agenda.length > 0 && (
                <ul className="agenda" role="list">
                  {agenda.map((e) => (
                    <li key={e.id}>
                      <button type="button" className="agenda__item" onClick={() => { setOpen(e); track('calendar_event_opened') }}>
                        <span className="agenda__bar" style={{ background: `var(--sender-${toneOf(e.calendarId)})` }} aria-hidden="true" />
                        <span className="people__text">
                          <span className="t-title-sm people__name">{e.title}</span>
                          <span className="t-caption muted">{eventTime(e)}{e.location ? ` · ${e.location}` : ''}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {admin && <Banner kind="info">You're viewing as an admin, so you also see calendars that aren't assigned to you.</Banner>}
          </>
        )}
      </div>

      {open && <EventSheet event={open} calendar={calendars.find((c) => c.id === open.calendarId)} onClose={() => setOpen(null)} />}
      {managing && <ManageSheet calendars={calendars} onClose={() => setManaging(false)} onChanged={() => { cals.reload(); events.reload() }} />}
    </main>
  )
}
