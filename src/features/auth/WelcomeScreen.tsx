import { useNavigate } from 'react-router-dom'
import { Button, Logo } from '../../design/ui'
import { AuthFrame } from './AuthFrame'

export function WelcomeScreen() {
  const navigate = useNavigate()
  return (
    <AuthFrame back={false}>
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
    </AuthFrame>
  )
}
