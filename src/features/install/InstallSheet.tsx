import { useState } from 'react'
import { BottomSheet, Button } from '../../design/ui'
import { IconCheck, IconCopy, IconUpload } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { runInstallPrompt, type InstallMode } from '../../state/install'

/**
 * How to put the app on the home screen, for whichever browser this is.
 */
export function InstallSheet({ mode, onClose }: { mode: InstallMode; onClose: () => void }) {
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  if (mode === 'installed' || done) {
    return (
      <BottomSheet title="Added to your home screen" onClose={onClose}>
        <div className="stack">
          <div className="perm"><span className="empty__icon"><IconCheck size={36} /></span><p className="t-body-sm muted">{done ? 'Open it from your home screen. It runs full screen, with no browser bars.' : "It's already on your home screen."}</p></div>
          <Button onClick={onClose}>Done</Button>
        </div>
      </BottomSheet>
    )
  }

  if (mode === 'prompt') {
    return (
      <BottomSheet title="Add to your home screen" onClose={onClose}>
        <div className="stack">
          <p className="t-body-sm muted">It opens full screen from your home screen, with no browser bars, and works like any other app.</p>
          <Button onClick={async () => {
            const r = await runInstallPrompt()
            track('install_prompt_answered', { result: r })
            if (r === 'accepted') setDone(true)
          }}>Add to home screen</Button>
          <Button variant="tertiary" onClick={onClose}>Not now</Button>
        </div>
      </BottomSheet>
    )
  }

  if (mode === 'in-app') {
    const url = typeof location === 'undefined' ? '' : location.origin
    return (
      <BottomSheet title="Open in your browser first" onClose={onClose}>
        <div className="stack">
          <p className="t-body-sm muted">This window belongs to another app, and it can't add anything to your home screen. Open the link in Safari or Chrome, then follow the steps there.</p>
          <div className="linkbox"><span className="linkbox__url">{url}</span></div>
          <Button onClick={() => { void navigator.clipboard?.writeText(url).then(() => { setCopied(true); track('install_link_copied') }, () => undefined) }}>
            {copied ? <><IconCheck size={18} /> Link copied</> : <><IconCopy size={18} /> Copy link</>}
          </Button>
          <Button variant="tertiary" onClick={onClose}>Close</Button>
        </div>
      </BottomSheet>
    )
  }

  if (mode === 'manual') {
    return (
      <BottomSheet title="Add to your home screen" onClose={onClose}>
        <div className="stack">
          <p className="t-body-sm muted">Open your browser's menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If you don't see it, try Chrome or Safari on your phone.</p>
          <Button onClick={onClose}>Got it</Button>
        </div>
      </BottomSheet>
    )
  }

  const safari = mode === 'ios-safari'
  return (
    <BottomSheet title="Add to your home screen" onClose={onClose}>
      <div className="stack">
        <p className="t-body-sm">
          Tap <strong>Share</strong> <IconUpload size={16} />{safari ? '' : ' (or the ⋯ menu)'}, then choose <strong>Add to Home Screen</strong>.
        </p>
        <p className="t-body-sm muted">It then opens full screen, with no browser bars.{safari ? '' : ' If you cannot find it, open this page in Safari.'}</p>
        <Button onClick={() => { track('install_steps_done', { mode }); onClose() }}>Got it</Button>
      </div>
    </BottomSheet>
  )
}
