import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../design/ui'
import { describeError } from '../../data/errors'
import { Banner } from '../../design/ui'

export function AuthFrame({ children, back = true }: { children: ReactNode; back?: boolean }) {
  const navigate = useNavigate()
  return (
    <main className="auth fade-in">
      {back && (
        <div className="auth__back">
          <BackButton onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/welcome'))} />
        </div>
      )}
      {children}
    </main>
  )
}

export function ErrorBanner({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const m = describeError(error)
  return (
    <Banner kind={m.offline ? 'offline' : 'error'} title={m.title} actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry}>
      {m.body}
    </Banner>
  )
}
