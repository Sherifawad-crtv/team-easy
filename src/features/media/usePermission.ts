import { useCallback, useEffect, useState } from 'react'
import { api } from '../../data'
import type { PermissionKind, PermissionStatus } from '../../data/types'

/** NFR-04: our own explanation first, then the real permission request. */
export function usePermission(kind: PermissionKind) {
  const [status, setStatus] = useState<PermissionStatus>('unknown')

  useEffect(() => {
    let live = true
    api.permissions.status(kind).then((s) => live && setStatus(s), () => undefined)
    return () => {
      live = false
    }
  }, [kind])

  const request = useCallback(async () => {
    const s = await api.permissions.request(kind)
    setStatus(s)
    return s
  }, [kind])

  return { status, request }
}
