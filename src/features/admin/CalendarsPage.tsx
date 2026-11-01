import { useMemo, useState, type FormEvent } from 'react'
import { api } from '../../data'
import type { CalendarEvent, CalendarInfo } from '../../data/types'
import { Banner, BottomSheet, Button, Skeleton, TextField } from '../../design/ui'
import { IconPlus } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { useAsync } from '../../state/useAsync'
import { useReviewRole } from '../../state/useReviewRole'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'
import { AssignSheet } from '../calendar/CalendarSheets'
import { eventTime } from '../calendar/dates'
import { PageHead } from './AdminShell'

const DAY = 86_400_000
const day = (ms: number) => new Date(ms).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
const pad = (n: number) => String(n).padStart(2, '0')
const todayText = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const at = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime()

function NewCalendarSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tone, setTone] = useState(0)
  const [touched, setTouched] = useState(false)
  const { busy, error, run } = useSubmit()
  return (
    <BottomSheet title="New calendar" onClose={onClose}>
      <form className="stack" noValidate onSubmit={async (e: FormEvent) => {
        e.preventDefault()
        setTouched(true)
        if (!name.trim()) return
        if (await run(() => api.calendar.createCalendar({ name, description, tone }))) { track('admin_calendar_created'); onCreated() }
      }}>
        {error != null && <ErrorBanner error={error} />}
        <TextField label="Name" value={name} onChange={setName} autoFocus maxLength={30} error={touched && !name.trim() ? 'Give it a name' : undefined} />
        <TextField label="What it is for (optional)" value={description} onChange={setDescription} maxLength={80} />
        <div role="radiogroup" aria-label="Colour" className="swatches">
          {[0, 1, 2, 3, 4].map((t) => <button key={t} type="button" role="radio" aria-checked={tone === t} aria-label={`Colour ${t + 1}`} className="swatch" style={{ background: `var(--sender-${t})` }} onClick={() => setTone(t)} />)}
        </div>
        <p className="t-body-sm muted">You are the first person it is assigned to. Assign others after.</p>
        <Button type="submit" loading={busy}>Create calendar</Button>
      </form>
    </BottomSheet>
  )
}

function NewEventSheet({ calendars, onClose, onCreated }: { calendars: CalendarInfo[]; onClose: () => void; onCreated: () => void }) {
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayText())
  const [allDay, setAllDay] = useState(false)
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('11:00')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)
  const { busy, error, run } = useSubmit()
  const problem = !title.trim() ? 'Give it a title' : !allDay && end <= start ? 'It has to end after it starts' : undefined
  return (
    <BottomSheet title="New event" onClose={onClose}>
      <form className="stack" noValidate onSubmit={async (e: FormEvent) => {
        e.preventDefault()
        setTouched(true)
        if (problem) return
        const startMs = allDay ? at(date, '00:00') : at(date, start)
        const endMs = allDay ? at(date, '23:59') : at(date, end)
        if (await run(() => api.calendar.createEvent({ calendarId, title: title.trim(), start: startMs, end: endMs, allDay, location: location.trim() || undefined, description: description.trim() || undefined }))) { track('admin_event_created'); onCreated() }
      }}>
        {error != null && <ErrorBanner error={error} />}
        <label className="field__label" htmlFor="ev-cal">Calendar</label>
        <select id="ev-cal" className="field__input" value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
          {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <TextField label="Title" value={title} onChange={setTitle} autoFocus error={touched ? problem : undefined} />
        <TextField label="Date" type="date" value={date} onChange={setDate} />
        <label className="check-row"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day</label>
        {!allDay && (
          <div className="row-flex" style={{ gap: 'var(--s-4)' }}>
            <TextField label="Starts" type="time" value={start} onChange={setStart} />
            <TextField label="Ends" type="time" value={end} onChange={setEnd} />
          </div>
        )}
        <TextField label="Where (optional)" value={location} onChange={setLocation} />
        <TextField label="Details (optional)" value={description} onChange={setDescription} />
        <Button type="submit" loading={busy}>Add event</Button>
      </form>
    </BottomSheet>
  )
}

/** Calendars (CAL-01, 02): make them, choose who has them, add and remove one-off events. */
export function CalendarsPage() {
  const role = useReviewRole()
  const cals = useAsync(() => api.calendar.calendars(), [role])
  const events = useAsync(() => { const from = Date.now() - DAY; return api.calendar.events(from, from + 31 * DAY) }, [role])
  const [dialog, setDialog] = useState<'calendar' | 'event' | null>(null)
  const [assigning, setAssigning] = useState<CalendarInfo | null>(null)
  const remove = useSubmit()
  const calendars = cals.status === 'ready' ? cals.data : []
  const name = useMemo(() => new Map(calendars.map((c) => [c.id, c])), [calendars])
  const reload = () => { cals.reload(); events.reload() }

  return (
    <div className="admin__page">
      <PageHead title="Calendars" sub="Choose who sees which calendar, and add events"
        action={<span className="row-flex" style={{ gap: 'var(--s-3)' }}>
          <Button variant="secondary" block={false} onClick={() => setDialog('calendar')}><IconPlus size={18} /> New calendar</Button>
          <Button block={false} disabled={calendars.length === 0} onClick={() => setDialog('event')}><IconPlus size={18} /> New event</Button>
        </span>} />
      {cals.status === 'loading' && <div aria-busy="true" aria-label="Loading calendars">{[0, 1, 2].map((i) => <Skeleton key={i} height={52} radius={12} />)}</div>}
      {cals.status === 'error' && <ErrorBanner error={cals.error} onRetry={cals.reload} />}
      {cals.status === 'ready' && calendars.length === 0 && <Banner kind="info" title="No calendars yet">Make one, then assign it to the people who should see it.</Banner>}
      {calendars.length > 0 && (
        <div className="atable-wrap">
          <table className="atable">
            <caption className="sr-only">Calendars</caption>
            <thead><tr><th scope="col">Calendar</th><th scope="col">About</th><th scope="col">People</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {calendars.map((c) => (
                <tr key={c.id}>
                  <th scope="row"><span className="atable__name"><span className="cal-dot" style={{ background: `var(--sender-${c.tone})` }} aria-hidden="true" /> {c.name}</span></th>
                  <td className="muted">{c.description || '—'}</td>
                  <td>{c.assignedCount}</td>
                  <td className="atable__actions"><Button variant="tertiary" block={false} onClick={() => setAssigning(c)}>Assign people</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="admin__section" aria-label="Upcoming events">
        <h2 className="t-title-sm">Next 30 days</h2>
        {remove.error != null && <ErrorBanner error={remove.error} />}
        {events.status === 'loading' && <Skeleton height={52} radius={12} />}
        {events.status === 'error' && <ErrorBanner error={events.error} onRetry={events.reload} />}
        {events.status === 'ready' && events.data.length === 0 && <p className="t-body-sm muted">No events in the next 30 days.</p>}
        {events.status === 'ready' && events.data.length > 0 && (
          <div className="atable-wrap">
            <table className="atable">
              <caption className="sr-only">Upcoming events</caption>
              <thead><tr><th scope="col">When</th><th scope="col">Event</th><th scope="col">Calendar</th><th scope="col">Type</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {events.data.slice(0, 40).map((e: CalendarEvent) => (
                  <tr key={e.id}>
                    <td>{day(e.start)}<span className="t-caption muted" style={{ display: 'block' }}>{eventTime(e)}</span></td>
                    <th scope="row">{e.title}{e.location && <span className="t-caption muted" style={{ display: 'block' }}>{e.location}</span>}</th>
                    <td>{name.get(e.calendarId)?.name ?? '—'}</td>
                    <td><span className="tag">{e.oneOff ? 'One-off' : 'Recurring'}</span></td>
                    <td className="atable__actions">{e.oneOff && <Button variant="tertiary" block={false} onClick={async () => { if (await remove.run(() => api.calendar.deleteEvent(e.id))) { track('admin_event_deleted'); reload() } }}>Delete</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog === 'calendar' && <NewCalendarSheet onClose={() => setDialog(null)} onCreated={() => { setDialog(null); reload() }} />}
      {dialog === 'event' && <NewEventSheet calendars={calendars} onClose={() => setDialog(null)} onCreated={() => { setDialog(null); reload() }} />}
      {assigning && <AssignSheet calendar={assigning} onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); reload() }} />}
    </div>
  )
}
