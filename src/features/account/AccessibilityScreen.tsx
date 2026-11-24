import { useNavigate } from 'react-router-dom'
import { BackButton, Segmented, SettingsGroup, SettingsRow, Switch } from '../../design/ui'
import { IconAccessibility, IconChat } from '../../design/icons'
import { settings, useHaptics, useTextSize, type TextSize } from '../../state/settings'
import { useMedia } from '../../state/useMedia'

const SIZES: { id: TextSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
]

/** Accessibility: message text size with a live preview, haptics, and how motion follows the phone. */
export function AccessibilityScreen() {
  const navigate = useNavigate()
  const size = useTextSize()
  const haptics = useHaptics()
  const reduced = useMedia('(prefers-reduced-motion: reduce)')

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Accessibility</h1>
      </header>
      <div className="page__body stack-lg">
        <section aria-label="Message text size" className="sgroup">
          <h2 className="sgroup__title">Message text size</h2>
          <div className="card stack" style={{ padding: 'var(--s-5)' }}>
            <div className="size-preview" aria-hidden="true">
              <div className="msg"><div className="bubble"><span className="bubble__text">Can you send the latest build?</span></div></div>
              <div className="msg msg--mine"><div className="bubble bubble--mine"><span className="bubble__text">On its way. Five minutes.</span></div></div>
            </div>
            <Segmented label="Message text size" options={SIZES} value={size} onChange={(v) => settings.setTextSize(v)} />
          </div>
          <p className="sgroup__footer">Changes the text of messages. Everything else follows your phone's text size.</p>
        </section>

        <SettingsGroup title="Feel">
          <SettingsRow icon={<IconChat size={20} />} title="Haptics" subtitle="A small tap you can feel for tabs, switches, sending and results"
            trailing={<Switch checked={haptics} label="Haptics" onChange={(v) => settings.setHaptics(v)} />} />
          <SettingsRow icon={<IconAccessibility size={20} />} title="Reduce motion" subtitle="Follows the setting on your phone" value={reduced ? 'On' : 'Off'} />
        </SettingsGroup>
      </div>
    </main>
  )
}
