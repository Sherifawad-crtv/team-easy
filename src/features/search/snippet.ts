export interface Piece {
  text: string
  hit: boolean
}

/** Cuts a window around the first match and marks the matching pieces. */
export function snippet(text: string, query: string, width = 90): Piece[] {
  const q = query.trim()
  if (!q) return [{ text: text.slice(0, width), hit: false }]
  const at = text.toLowerCase().indexOf(q.toLowerCase())
  if (at < 0) return [{ text: text.length > width ? `${text.slice(0, width)}…` : text, hit: false }]
  const start = Math.max(0, at - 28)
  const end = Math.min(text.length, start + width)
  const out: Piece[] = []
  if (start > 0) out.push({ text: '…', hit: false })
  out.push({ text: text.slice(start, at), hit: false })
  out.push({ text: text.slice(at, at + q.length), hit: true })
  out.push({ text: text.slice(at + q.length, end), hit: false })
  if (end < text.length) out.push({ text: '…', hit: false })
  return out.filter((p) => p.text)
}
