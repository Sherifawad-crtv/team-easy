import { useNavigate } from 'react-router-dom'
import { LEGAL } from '../../config/legal'
import { BackButton, SettingsGroup, SettingsRow } from '../../design/ui'
import { IconDocument, IconHelp, IconInfo, IconLink, IconMail, IconShield, IconUser } from '../../design/icons'
import { useAnimatedNavigate } from '../../design/nav'

/** Help: the help center, a way to reach us, and the legal pages the stores require inside the app. */
export function HelpScreen() {
  const navigate = useNavigate()
  const go = useAnimatedNavigate()
  const contact = () => {
    const body = encodeURIComponent(`\n\n---\nVersion ${LEGAL.version} (${LEGAL.build})\n${navigator.userAgent}`)
    window.location.href = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent('Help with the app')}&body=${body}`
  }
  return (
    <main className="page surface fade-in">
      <header className="bar bar--back">
        <BackButton onClick={() => navigate('/account')} />
        <h1 className="bar__title">Help</h1>
      </header>
      <div className="page__body stack-lg">
        <SettingsGroup title="Get help">
          <SettingsRow icon={<IconHelp size={20} />} title="Help center" subtitle="Answers to common questions" external onClick={() => window.open(LEGAL.helpCenterUrl, '_blank', 'noopener')} />
          <SettingsRow icon={<IconMail size={20} />} title="Contact us" subtitle={LEGAL.supportEmail} onClick={contact} />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon={<IconDocument size={20} />} title="Terms of Service" onClick={() => go('/legal/terms')} />
          <SettingsRow icon={<IconShield size={20} />} title="Privacy Policy" onClick={() => go('/legal/privacy')} />
          <SettingsRow icon={<IconUser size={20} />} title="Community guidelines" onClick={() => go('/legal/guidelines')} />
          <SettingsRow icon={<IconLink size={20} />} title="Open-source licenses" onClick={() => go('/legal/licenses')} />
          <SettingsRow icon={<IconInfo size={20} />} title="App version" value={`${LEGAL.version} (${LEGAL.build})`} />
        </SettingsGroup>
      </div>
    </main>
  )
}
