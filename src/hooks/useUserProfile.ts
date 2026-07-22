import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { getProfileByUserId, saveProfile } from '#/lib/db/profiles'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import type { UserProfile, UserProfileInput } from '#/types/profile'

/**
 * Loads and saves the signed-in user's synced profile.
 *
 * @returns Profile data and save helper
 *
 * @example
 * const { profile, save } = useUserProfile()
 */
export function useUserProfile() {
  const { user, isLoggedIn } = useCloudAuth()
  const userId = isLoggedIn ? (user.userId ?? '') : ''

  const profile = useLiveQuery(
    async () => {
      if (!userId) return null
      return (await getProfileByUserId(userId)) ?? null
    },
    [userId],
    null,
  )

  /**
   * Persists profile fields for the current user.
   *
   * @param input - Username and display name
   * @returns Saved profile
   */
  const save = useCallback(
    async (input: UserProfileInput): Promise<UserProfile> => {
      if (!userId) {
        throw new Error('You must be signed in to update your profile.')
      }
      return saveProfile(userId, input)
    },
    [userId],
  )

  return {
    userId,
    profile,
    save,
  }
}
