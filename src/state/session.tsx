import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../data'
import type { Account, IdentityKind, ProfilePatch, SignUpData } from '../data/types'
import { track } from '../analytics'
import { clearAsyncCache } from './useAsync'

interface SessionValue {
  /** `undefined` while the saved session is being restored. */
  account: Account | null | undefined
  signIn(email: string, password: string): Promise<void>
  signUp(data: SignUpData): Promise<void>
  signOut(): Promise<void>
  switchIdentity(kind: IdentityKind): Promise<void>
  deleteAccount(): Promise<void>
  updateProfile(patch: ProfilePatch): Promise<void>
}

const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined)

  useEffect(() => {
    let live = true
    api.auth.restoreSession().then(
      (a) => live && setAccount(a),
      () => live && setAccount(null),
    )
    return () => {
      live = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await api.auth.signIn(email, password)
    clearAsyncCache()
    setAccount(next)
    track('sign_in_completed')
  }, [])
  const signUp = useCallback(async (data: SignUpData) => {
    const next = await api.auth.signUp(data)
    clearAsyncCache()
    setAccount(next)
    track('signup_completed', { with_invite: Boolean(data.inviteToken) })
  }, [])
  const signOut = useCallback(async () => {
    await api.auth.signOut()
    clearAsyncCache()
    setAccount(null)
  }, [])
  const switchIdentity = useCallback(async (kind: IdentityKind) => {
    const next = await api.auth.switchIdentity(kind)
    clearAsyncCache()
    setAccount(next)
  }, [])
  const deleteAccount = useCallback(async () => {
    await api.auth.deleteAccount()
    clearAsyncCache()
    setAccount(null)
  }, [])

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    setAccount(await api.profile.updateProfile(patch))
    track('profile_saved', { photo: patch.photoUrl !== undefined })
  }, [])

  const value = useMemo(
    () => ({ account, signIn, signUp, signOut, switchIdentity, deleteAccount, updateProfile }),
    [account, signIn, signUp, signOut, switchIdentity, deleteAccount, updateProfile],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSession needs a SessionProvider')
  return v
}
