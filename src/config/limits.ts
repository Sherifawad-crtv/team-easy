// Business limits from the PRD, in one place. Screens read these, never a literal.
// The server enforces every one of them; the client only warns early.

export const LIMITS = {
  /** Assumed, the PRD sets no size limit (open question 15). */
  maxAttachmentBytes: 25_000_000,
  /** DAT-02: unopened attachments are deleted after this many days. */
  attachmentRetentionDays: { standard: 6, business: 15 },
} as const

/** File sizes in decimal units (1 MB = 1,000,000 bytes), like iOS and Android show them. */
export function formatBytes(n: number): string {
  if (n < 1000) return `${n} B`
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)} KB`
  return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)} MB`
}
