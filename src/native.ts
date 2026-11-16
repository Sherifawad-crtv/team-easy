// Small bits of "behave like an app" that CSS cannot do (docs/PWA_SPEC.md).
//  - no pinch zoom of the page (Safari ignores user-scalable=no, so we stop its gesture events)
//  - no browser context menu on a long press, except in text fields
//  - no dragging of pictures and links out of the page
// The picture viewer zooms by itself, from its own touch handling, so it is not affected.

const FIELD = 'input, textarea, select, [contenteditable="true"], .selectable'

export function installNativeFeel(doc: Document = document): () => void {
  const win = doc.defaultView
  const touch = Boolean(win?.matchMedia?.('(pointer: coarse)').matches)
  const stop = (e: Event) => e.preventDefault()
  const contextMenu = (e: Event) => {
    if (!touch) return
    if ((e.target as HTMLElement | null)?.closest?.(FIELD)) return
    e.preventDefault()
  }
  const dragStart = (e: Event) => {
    if ((e.target as HTMLElement | null)?.closest?.(FIELD)) return
    e.preventDefault()
  }
  doc.addEventListener('gesturestart', stop)
  doc.addEventListener('gesturechange', stop)
  doc.addEventListener('contextmenu', contextMenu)
  doc.addEventListener('dragstart', dragStart)
  return () => {
    doc.removeEventListener('gesturestart', stop)
    doc.removeEventListener('gesturechange', stop)
    doc.removeEventListener('contextmenu', contextMenu)
    doc.removeEventListener('dragstart', dragStart)
  }
}
