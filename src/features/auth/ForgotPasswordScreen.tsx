import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../data'
import { Button, TextField } from '../../design/ui'
import { IconCheckCircle } from '../../design/icons'
import { useSubmit } from '../../state/useSubmit'
import { AuthFrame, ErrorBanner } from './AuthFrame'
import { validate } from './validators'

// Password reset is assumed (PRD open question 14).
export function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const { busy, error, run } = useSubmit()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const problem = validate.email(email)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (problem) return
    const address = email.trim()
    if (await run(() => api.auth.requestPasswordReset(address))) setSentTo(address)
  }

  if (sentTo) {
    return (
      <AuthFrame>
        <span style={{ color: 'var(--action)' }}><IconCheckCircle size={48} /></span>
        <h1 className="t-headline" style={{ marginTop: 'var(--s-5)' }}>Check your inbox</h1>
        <p className="t-body muted" style={{ marginTop: 'var(--s-4)' }}>
          If {sentTo} has an account, a reset link is on its way. It can take a few minutes.
        </p>
        <div style={{ marginTop: 'var(--s-8)' }}>
          <Button onClick={() => navigate('/sign-in', { replace: true })}>Back to sign in</Button>
        </div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <h1 className="t-headline">Reset your password</h1>
      <p className="t-body muted" style={{ marginTop: 'var(--s-4)' }}>
        Enter the email you signed up with and we'll send you a reset link.
      </p>
      <form className="stack" style={{ marginTop: 'var(--s-7)' }} onSubmit={submit} noValidate>
        {error != null && <ErrorBanner error={error} onRetry={busy ? undefined : () => void submit()} />}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={setEmail} error={touched ? problem : undefined} disabled={busy} />
        <Button type="submit" loading={busy}>Send reset link</Button>
      </form>
    </AuthFrame>
  )
}
