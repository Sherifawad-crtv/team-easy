import { useState } from 'react'
import type { Message } from '../../data/types'
import { formatBytes } from '../../config/limits'
import { IconClock, IconDocument, IconDownload } from '../../design/icons'
import { settings, useCacheVersion, useConnection, useMediaPolicy } from '../../state/settings'
import { daysLeftLabel, isExpiringSoon } from '../data/retention'
import { ImageViewer } from './ImageViewer'
import { mediaState } from './mediaState'

const EXT_TONE: Record<string, string> = { pdf: 'pdf', doc: 'doc', docx: 'doc', xls: 'xls', xlsx: 'xls', csv: 'xls', ppt: 'ppt', pptx: 'ppt', zip: 'zip', txt: 'doc' }

export const fileExt = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/** File type badge: PDF, DOC, XLS... in a tone per type. */
export function DocIcon({ name }: { name: string }) {
  const ext = fileExt(name)
  return <span className={`doc-icon doc-icon--${EXT_TONE[ext] ?? 'doc'}`} aria-hidden="true">{ext.slice(0, 4).toUpperCase() || <IconDocument size={20} />}</span>
}

/** An image or document inside a bubble. Respects the download setting (MED-05) and the cache (DAT-03). */
export function MessageAttachment({ message, mine }: { message: Message; mine: boolean }) {
  const a = message.attachment!
  const policy = useMediaPolicy()
  const connection = useConnection()
  useCacheVersion()
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState(false)

  const state = mediaState({ mine, expired: Boolean(a.expired), cached: settings.isCached(message.id), policy, connection })

  const download = () => {
    setBusy(true)
    window.setTimeout(() => {
      settings.cacheMedia(message.id)
      setBusy(false)
    }, 900)
  }

  if (state === 'expired') {
    return (
      <div className="file-gone">
        <IconDocument size={20} />
        <span>This {a.kind === 'image' ? 'photo' : 'file'} is no longer available. Files that are not opened are deleted after a few days.</span>
      </div>
    )
  }

  // DAT-02: say so when an unopened file is about to be deleted.
  const note = !mine && !settings.isCached(message.id) && a.expiresAt && isExpiringSoon(a.expiresAt)
    ? <span className="file-expiry"><IconClock size={14} /> Deleted in {daysLeftLabel(a.expiresAt).text.replace(' left', '')} unless you open it</span>
    : null

  if (a.kind === 'image') {
    if (state === 'needs-download') {
      return (
        <>
          <button type="button" className="img-wait" onClick={download} aria-busy={busy || undefined} aria-label={`Download photo, ${formatBytes(a.size)}`}>
            {busy ? <span className="spinner" aria-label="Downloading" /> : <IconDownload size={26} />}
            <span>{busy ? 'Downloading…' : `Photo · ${formatBytes(a.size)}`}</span>
          </button>
          {note}
        </>
      )
    }
    return (
      <>
        <button type="button" className="img-thumb" onClick={() => { settings.cacheMedia(message.id); setViewing(true) }} aria-label={`Open photo ${a.name}`}>
          <img src={a.url} alt={message.text || a.name} loading="lazy" />
        </button>
        {note}
        {viewing && <ImageViewer message={message} onClose={() => setViewing(false)} />}
      </>
    )
  }

  // Document
  const open = () => {
    settings.cacheMedia(message.id)
    if (a.url) window.open(a.url, '_blank', 'noopener')
  }
  return (
    <>
    <div className="doc-row">
      <DocIcon name={a.name} />
      <span className="doc-row__text">
        <span className="doc-row__name">{a.name}</span>
        <span className="doc-row__meta">{fileExt(a.name).toUpperCase()} · {formatBytes(a.size)}</span>
      </span>
      {state === 'needs-download' ? (
        <button type="button" className="icon-btn doc-row__act" aria-label={`Download ${a.name}`} aria-busy={busy || undefined} onClick={download}>
          {busy ? <span className="spinner" aria-label="Downloading" /> : <IconDownload size={22} />}
        </button>
      ) : (
        <button type="button" className="doc-row__open" onClick={open} aria-label={`Open ${a.name}`}>Open</button>
      )}
    </div>
    {note}
    </>
  )
}
