// Measures how long a visitor takes to open their first conversation after
// the chat list appears. Feeds the A/B metric `ms_since_list`.

let listShownAt: number | null = null
let opened = false

export const listTiming = {
  shown() {
    if (listShownAt === null) listShownAt = Date.now()
  },
  /** Returns the measurement for a chat being opened, once per session for `first`. */
  opened(): { ms_since_list: number | null; first: boolean } {
    const first = !opened
    opened = true
    return { ms_since_list: listShownAt === null ? null : Date.now() - listShownAt, first }
  },
  reset() {
    listShownAt = null
    opened = false
  },
}
