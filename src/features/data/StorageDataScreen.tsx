import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { formatBytes } from '../../config/limits'
import { BackButton, SettingsGroup, SettingsRow, Switch } from '../../design/ui'
import { IconBackup, IconCall, IconDatabase } from '../../design/icons'
import { useAnimatedNavigate } from '../../design/nav'
import { settings, useLessData, useMediaPolicy, type MediaPolicy } from '../../state/settings'
import { useAsync } from '../../state/useAsync'

const MEDIA_CHOICES: { id: MediaPolicy; title: string; sub: string }[] = [
  { id: 'auto', title: 'Always', sub: 'Download everything as it arrives' },
  { id: 'wifi', title: 'Wi-Fi only', sub: 'Wait for Wi-Fi, tap to download on mobile data' },
  { id: 'manual', title: 'Never', sub: 'Tap each photo or document to download it' },
]

/** Storage and data: when media downloads (MED-05), calling data, what the device holds, backups and deletion rules. */
export function StorageDataScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const policy = useMediaPolicy()
  const lessData = useLessData()
  const usage = useAsync(() => api.data.storage(), [])

  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Storage and data</h1>
      </header>
      <div className="page__body stack-lg">
        <section>
          <h2 className="sgroup__title" style={{ marginBottom: 'var(--s-1)' }}>Media auto-download</h2>
          <p className="sgroup__footer" style={{ marginBottom: 'var(--s-3)' }}>When photos and documents you receive download on their own.</p>
          <div className="card" role="radiogroup" aria-label="Media auto-download">
            {MEDIA_CHOICES.map((c) => (
              <button key={c.id} type="button" className="radio-row" role="radio" aria-checked={policy === c.id} onClick={() => settings.setPolicy(c.id)}>
                <span className="radio-dot" />
                <span>
                  <span className="t-title-sm" style={{ display: 'block' }}>{c.title}</span>
                  <span className="t-body-sm muted">{c.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <SettingsGroup title="Calls">
          <SettingsRow icon={<IconCall size={20} />} title="Use less data for calls" subtitle="Lower quality on mobile data, so calls use less"
            trailing={<Switch checked={lessData} label="Use less data for calls" onChange={(on) => settings.setLessData(on)} />} />
        </SettingsGroup>

        <SettingsGroup title="On this device">
          <SettingsRow icon={<IconDatabase size={20} />} title="Manage storage"
            value={usage.status === 'ready' ? formatBytes(usage.data.total) : undefined}
            subtitle={usage.status === 'error' ? "Couldn't load. Tap to open" : 'See what each chat holds and free up space'}
            onClick={() => go('/account/data/storage')} />
        </SettingsGroup>

        <SettingsGroup title="Backup and deletion">
          <SettingsRow icon={<IconBackup size={20} />} title="Backup, transfer and deletion rules" subtitle="Back up chats, move to a new phone, files that will be deleted" onClick={() => go('/account/data/backup')} />
        </SettingsGroup>
      </div>
    </main>
  )
}
