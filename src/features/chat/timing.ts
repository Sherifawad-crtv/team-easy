// Measures how long a visitor takes to open their first conversation (or
// group) after the list appears. Feeds the A/B metric `ms_since_list`.

function createTiming() {
  let shownAt: number | null = null
  let opened = false
  return {
    shown() {
      if (shownAt === null) shownAt = Date.now()
    },
    /** Returns the measurement for an open, once per session for `first`. */
    opened(): { ms_since_list: number | null; first: boolean } {
      const first = !opened
      opened = true
      return { ms_since_list: shownAt === null ? null : Date.now() - shownAt, first }
    },
    reset() {
      shownAt = null
      opened = false
    },
  }
}

export const listTiming = createTiming()
export const groupTiming = createTiming()
