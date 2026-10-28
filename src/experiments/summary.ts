import { EXPERIMENT_IDS, type ExperimentId, type Variant } from './experiments'

export interface TrackedEvent {
  id: string
  at: number
  visitor_id: string
  session_id: string
  event: string
  variants: Partial<Record<ExperimentId, Variant>>
  props: Record<string, unknown>
  forced: boolean
}

export interface SummaryRow {
  experiment: ExperimentId
  variant: Variant
  visitors: number
  opens: number
  messages: number
  avgMsToFirstOpen: number | null
}

/** The event that counts as "opened something" for each experiment. */
export const OPEN_EVENT: Record<ExperimentId, 'chat_opened' | 'group_opened'> = {
  chat_list: 'chat_opened',
  conversation: 'chat_opened',
  group_nav: 'group_opened',
}

/**
 * Rolls events up per experiment and variant. Same rules as the database
 * function `ab_summary`: forced (review) sessions are ignored, visitors are
 * counted once, time-to-open uses the first chat opened after the list loads.
 */
export function summarize(events: TrackedEvent[]): SummaryRow[] {
  const rows: SummaryRow[] = []
  for (const experiment of EXPERIMENT_IDS) {
    for (const variant of ['A', 'B'] as const) {
      const bucket = events.filter((e) => !e.forced && e.variants[experiment] === variant)
      const visitors = new Set(bucket.map((e) => e.visitor_id)).size
      const openEvent = OPEN_EVENT[experiment]
      const first = bucket
        .filter((e) => e.event === openEvent && e.props.first === true)
        .map((e) => e.props.ms_since_list)
        .filter((n): n is number => typeof n === 'number')
      rows.push({
        experiment,
        variant,
        visitors,
        opens: bucket.filter((e) => e.event === openEvent).length,
        messages: bucket.filter((e) => e.event === 'message_sent').length,
        avgMsToFirstOpen: first.length ? Math.round(first.reduce((a, b) => a + b, 0) / first.length) : null,
      })
    }
  }
  return rows
}
