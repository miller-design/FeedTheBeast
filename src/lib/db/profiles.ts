import { db } from '#/lib/db'
import type { UserProfile, UserProfileInput } from '#/types/profile'

/**
 * Loads the synced profile for a user, if one exists.
 *
 * @param userId - Dexie Cloud user id
 * @returns Profile or undefined
 *
 * @example
 * const profile = await getProfileByUserId('you@example.com')
 */
export async function getProfileByUserId(
  userId: string,
): Promise<UserProfile | undefined> {
  return db.profiles.get(userId)
}

/**
 * Creates or updates the signed-in user's profile and lets Dexie Cloud sync it.
 *
 * @param userId - Dexie Cloud user id
 * @param input - Username and display name
 * @returns Saved profile
 *
 * @example
 * await saveProfile('you@example.com', { username: 'jack', displayName: 'Jack' })
 */
export async function saveProfile(
  userId: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const profile: UserProfile = {
    id: userId,
    username: input.username.trim(),
    displayName: input.displayName.trim(),
    updatedAt: new Date().toISOString(),
  }
  await db.profiles.put(profile)
  return profile
}
