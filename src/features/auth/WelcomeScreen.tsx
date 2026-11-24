import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banner, Button, Logo } from '../../design/ui'
import { AuthFrame } from './AuthFrame'

export function WelcomeScreen() {
  const navigate = useNavigate()
  // Shown once, after an account was deleted from Settings.
  const [deleted] = useState(() => {
    try {
      return sessionStorage.getItem('te.accountDeleted') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try { sessionStorage.removeItem('te.accountDeleted') } catch { /* fine */ }
  }, [])
  return (
    <AuthFrame back={false}>
      {deleted && <div style={{ marginTop: 'var(--s-5)' }}><Banner kind="success" title="Your account was deleted">Your profile, chats and files are gone. You can create a new account at any time.</Banner></div>}
      <div style={{ height: 'var(--s-9)' }} />
      <Logo size={72} label="Team Easy" />
      <h1 className="t-display" style={{ marginTop: 'var(--s-8)' }}>Your team, one tap away.</h1>
      <p className="t-body muted" style={{ marginTop: 'var(--s-4)' }}>
        Chat, call and plan with the people you work with, whether you are on your own or part of an organization.
      </p>
      <div className="stack" style={{ marginTop: 'var(--s-9)' }}>
        <Button onClick={() => navigate('/sign-up')}>Create account</Button>
        <Button variant="secondary" onClick={() => navigate('/sign-in')}>Sign in</Button>
        <Button variant="tertiary" onClick={() => navigate('/invite')}>I have an organization invite</Button>
      </div>
      <p className="t-caption muted legal-note"><Link to="/legal/terms">Terms of Service</Link> · <Link to="/legal/privacy">Privacy Policy</Link></p>
    </AuthFrame>
  )
}
