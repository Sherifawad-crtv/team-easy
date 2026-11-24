import { useState } from 'react'
import { api } from '../../data'
import { LEGAL } from '../../config/legal'
import type { ReportReason, ReportTarget } from '../../data/types'
import { BottomSheet, Button, Switch, TextField } from '../../design/ui'
import { IconCheck } from '../../design/icons'
import { haptic } from '../../design/haptics'
import { track } from '../../analytics'
import { useSubmit } from '../../state/useSubmit'
import { ErrorBanner } from '../auth/AuthFrame'

const REASONS: { id: ReportReason; title: string }[] = [
  { id: 'spam', title: 'Spam' },
  { id: 'harassment', title: 'Harassment or bullying' },
  { id: 'hate', title: 'Hate speech' },
  { id: 'violence', title: 'Violence or threats' },
  { id: 'sexual', title: 'Sexual content' },
  { id: 'scam', title: 'Scam or fraud' },
  { id: 'other', title: 'Something else' },
]

/**
 * Report a message, a person or a group. Apple (guideline 1.2) and Google Play (User Generated
 * Content policy) both require a clear in-app way to report objectionable content and users.
 * A report is private, the reporter is told how fast it is looked at, and can block at the same time.
 */
export function ReportSheet({ target, subject, canBlock, onClose }: { target: ReportTarget; subject: string; canBlock: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [block, setBlock] = useState(false)
  const [sent, setSent] = useState<{ blocked: boolean } | null>(null)
  const send = useSubmit()
  const what = target.kind === 'group' ? 'group' : target.kind === 'message' ? 'message' : 'person'

  if (sent) {
    return (
      <BottomSheet title="Report sent" onClose={onClose}>
        <div className="stack">
          <div className="perm">
            <span className="empty__icon success-mark"><IconCheck size={36} /></span>
            <p className="t-title">Thank you</p>
            <p className="t-body-sm muted">We look at every report within {LEGAL.reportReviewHours} hours and take action if the rules were broken. {subject} isn't told who reported.{sent.blocked ? ` ${subject} is now blocked.` : ''}</p>
          </div>
          <Button onClick={onClose}>Done</Button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title={`Report ${what}`} onClose={onClose}>
      <div className="stack">
        <p className="t-body-sm muted">Your report is private. Tell us what is wrong with {subject}'s {what === 'person' ? 'behavior' : what}.</p>
        {send.error != null && <ErrorBanner error={send.error} />}
        <div className="card" role="radiogroup" aria-label="Reason">
          {REASONS.map((r) => (
            <button key={r.id} type="button" className="radio-row" role="radio" aria-checked={reason === r.id} onClick={() => setReason(r.id)}>
              <span className="radio-dot" />
              <span className="t-title-sm">{r.title}</span>
            </button>
          ))}
        </div>
        <TextField label="Add details (optional)" value={details} onChange={setDetails} disabled={send.busy} />
        {canBlock && (
          <div className="card">
            <div className="setting-row">
              <span>
                <span className="t-title-sm" style={{ display: 'block' }}>Also block {subject}</span>
                <span className="t-body-sm muted">They can't message or call you</span>
              </span>
              <Switch checked={block} label={`Also block ${subject}`} onChange={setBlock} />
            </div>
          </div>
        )}
        <Button variant="destructive" loading={send.busy} disabled={!reason} onClick={async () => {
          if (!reason) return
          if (await send.run(() => api.safety.report({ target, reason, details: details.trim() || undefined, block: canBlock && block }))) {
            haptic('success')
            track('report_sent', { kind: target.kind, reason })
            setSent({ blocked: canBlock && block })
          }
        }}>{send.error != null ? 'Try again' : 'Send report'}</Button>
        <Button variant="tertiary" onClick={onClose} disabled={send.busy}>Cancel</Button>
      </div>
    </BottomSheet>
  )
}
