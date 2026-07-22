import { db, isCloudConfigured } from '#/lib/db'

const CLAIM_FLAG_KEY = 'feedthebeast-cloud-claimed'

type DeleteAccountResult = { success: true } | { success: false; error: string }

/**
 * Permanently deletes the signed-in Dexie Cloud user and clears local app data.
 * Uses the user's access token (GDPR self-delete on `/users/:userId`).
 *
 * @returns Success or an error message
 *
 * @example
 * const result = await deleteCurrentAccount()
 */
export async function deleteCurrentAccount(): Promise<DeleteAccountResult> {
  if (!isCloudConfigured()) {
    return { success: false, error: 'Cloud sync is not configured.' }
  }

  const user = db.cloud.currentUser.value
  if (!user.isLoggedIn || !user.userId || !user.accessToken) {
    return { success: false, error: 'You must be signed in to delete your account.' }
  }

  const databaseUrl = (import.meta.env.VITE_DEXIE_CLOUD_URL ?? '').replace(/\/$/, '')
  if (!databaseUrl) {
    return { success: false, error: 'Missing Dexie Cloud URL.' }
  }

  const userId = user.userId
  const response = await fetch(`${databaseUrl}/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return {
      success: false,
      error: detail || `Could not delete account (${response.status}).`,
    }
  }

  await clearLocalAppData()
  try {
    await db.cloud.logout({ force: true })
  } catch {
    // Account is already gone server-side; local logout may fail.
  }

  return { success: true }
}

/**
 * Wipes local IndexedDB tables and related flags after account deletion.
 */
async function clearLocalAppData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLAIM_FLAG_KEY)
  }

  await Promise.all([
    db.mealPlans.clear(),
    db.savedMeals.clear(),
    db.recipes.clear(),
    db.profiles.clear(),
  ])
}
