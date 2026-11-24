import { useNavigate } from 'react-router-dom'
import { BackButton, SettingsGroup, SettingsRow } from '../../design/ui'
import { IconBackup } from '../../design/icons'
import { useAnimatedNavigate } from '../../design/nav'
import { settings, useUploadQuality, type UploadQuality } from '../../state/settings'

const QUALITY: { id: UploadQuality; title: string; sub: string }[] = [
  { id: 'standard', title: 'Standard quality', sub: 'Smaller photos that send faster and use less data' },
  { id: 'original', title: 'Original quality', sub: 'Full-size photos. Uses more data' },
]

/** Chats: how photos are sent, and where backup and transfer live. */
export function ChatsSettingsScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const quality = useUploadQuality()

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Chats</h1>
      </header>
      <div className="page__body stack-lg">
        <section>
          <h2 className="sgroup__title" style={{ marginBottom: 'var(--s-1)' }}>Photo upload quality</h2>
          <p className="sgroup__footer" style={{ marginBottom: 'var(--s-3)' }}>How photos you send are prepared.</p>
          <div className="card" role="radiogroup" aria-label="Photo upload quality">
            {QUALITY.map((c) => (
              <button key={c.id} type="button" className="radio-row" role="radio" aria-checked={quality === c.id} onClick={() => settings.setUploadQuality(c.id)}>
                <span className="radio-dot" />
                <span>
                  <span className="t-title-sm" style={{ display: 'block' }}>{c.title}</span>
                  <span className="t-body-sm muted">{c.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <SettingsGroup title="Backup">
          <SettingsRow icon={<IconBackup size={20} />} title="Chat backup and transfer" subtitle="Back up your chats or move them to a new phone" onClick={() => go('/account/data/backup')} />
        </SettingsGroup>
      </div>
    </main>
  )
}
