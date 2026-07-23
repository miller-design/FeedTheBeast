import { useCallback, useEffect } from 'react'
import { useObservable } from 'dexie-react-hooks'
import type { SyncState, UserLogin } from 'dexie-cloud-addon'

import { claimLocalDataIfNeeded } from '#/lib/db/claim-local-data'
import { db, isCloudConfigured } from '#/lib/db'

const UNAUTHORIZED_USER_ID = 'unauthorized'

const defaultUser = {
  userId: UNAUTHORIZED_USER_ID,
  claims: {},
  lastLogin: new Date(),
} as UserLogin

/**
 * Subscribes to Dexie Cloud auth and sync state for the signed-in experience.
 *
 * Note: Dexie sets `currentUser.isLoading` until the DB opens. We never treat
 * that as a permanent gate — the DB often cannot finish opening until login.
 *
 * @returns Cloud config flag, user, sync state, and login/logout helpers
 *
 * @example
 * const { isLoggedIn, user, login, logout, syncLabel } = useCloudAuth()
 */
export function useCloudAuth() {
  const configured = isCloudConfigured()
  const user = useObservable(() => db.cloud.currentUser, [], defaultUser)
  const syncState = useObservable(() => db.cloud.syncState, [], {
    status: 'not-started',
    phase: 'initial',
  } as SyncState)

  const isLoggedIn = Boolean(
    user.isLoggedIn && user.userId !== UNAUTHORIZED_USER_ID,
  )

  useEffect(() => {
    if (!configured || !isLoggedIn) return
    void claimLocalDataIfNeeded()
  }, [configured, isLoggedIn, user.userId])

  /**
   * Opens Dexie Cloud OTP login (built-in UI) and finishes DB open.
   */
  const login = useCallback(async () => {
    await db.cloud.login()
  }, [])

  /**
   * Signs out of Dexie Cloud on this device.
   */
  const logout = useCallback(async () => {
    await db.cloud.logout()
  }, [])

  const syncLabel = syncStatusLabel(syncState)

  return {
    configured,
    user,
    isLoggedIn,
    syncState,
    syncLabel,
    login,
    logout,
  }
}

/**
 * Maps Dexie Cloud sync state to a short header label.
 *
 * @param state - Current sync state from `db.cloud.syncState`
 * @returns Human-readable status string
 *
 * @example
 * syncStatusLabel({ status: 'connected', phase: 'in-sync' }) // "Synced"
 */
function syncStatusLabel(state: SyncState | undefined): string {
  if (!state) return ''
  if (state.status === 'offline' || state.phase === 'offline') return 'Offline'
  if (state.phase === 'error' || state.status === 'error') return 'Sync error'
  if (state.phase === 'pushing' || state.phase === 'pulling') return 'Syncing…'
  if (state.phase === 'in-sync') return 'Synced'
  if (state.status === 'connecting' || state.status === 'connected')
    return 'Connected'
  return ''
}
