import { useState, type ReactNode } from 'react'
import { BottomSheet, Button } from '../../design/ui'
import { IconCheck, IconChevronDown, IconCopy, IconPlus, IconUpload } from '../../design/icons'
import { track } from '../../experiments/analytics'
import { runInstallPrompt, type InstallMode } from '../../state/install'

function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <li className="istep">
      <span className="istep__n" aria-hidden="true">{n}</span>
      <span className="istep__body">
        <span className="t-title-sm" style={{ display: 'block' }}>{title}</span>
        {children}
      </span>
    </li>
  )
}

/** A drawn browser bar with the Share button called out, so people know what to look for. */
function ShareMock() {
  return (
    <span className="ishare" aria-hidden="true">
      <span className="ishare__bar">
        <span className="ishare__dot" /><span className="ishare__dot" />
        <span className="ishare__btn is-hit"><IconUpload size={18} /></span>
        <span className="ishare__dot" /><span className="ishare__dot" />
      </span>
    </span>
  )
}

/**
 * How to put the app on the home screen, for whichever browser this is. It
 * opens full screen like an app, with no browser bars, and shows up in the app switcher.
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
      <div className="stack" style={safari ? { paddingBottom: 'var(--s-9)' } : undefined}>
        <p className="t-body-sm muted">On iPhone this takes three taps. The app then opens full screen, with no browser bars.</p>
        <ol className="isteps">
          <Step n={1} title={safari ? 'Tap the Share button' : 'Tap the Share button or the ⋯ menu'}>
            <ShareMock />
            <span className="t-body-sm muted">It's the square with an arrow pointing up. {safari ? "In newer versions of iOS it's inside the ⋯ menu." : 'If you cannot find it, open this page in Safari.'}</span>
          </Step>
          <Step n={2} title="Choose Add to Home Screen">
            <span className="iadd" aria-hidden="true"><IconPlus size={18} /> Add to Home Screen</span>
            <span className="t-body-sm muted">Scroll down the list if you don't see it right away.</span>
          </Step>
          <Step n={3} title="Tap Add">
            <span className="t-body-sm muted">The icon appears on your home screen. Open it from there.</span>
          </Step>
        </ol>
        <Button onClick={() => { track('install_steps_done', { mode }); onClose() }}>Got it</Button>
      </div>
      {safari && <span className="ipointer" aria-hidden="true"><span>Share button is down here</span><IconChevronDown size={18} /></span>}
    </BottomSheet>
  )
}
