import { db } from '#/lib/db'

const CLAIM_FLAG_KEY = 'feedthebeast-cloud-claimed'

type CloudEntity = {
  id: string
  owner?: string
  realmId?: string
}

/**
 * Assigns pre-cloud IndexedDB rows to the signed-in user's private realm once.
 *
 * Dexie Cloud usually syncifies unauthorized objects on login; this re-put covers
 * data created before the cloud addon was enabled. Runs once per browser via
 * localStorage.
 *
 * @example
 * await claimLocalDataIfNeeded()
 */
export async function claimLocalDataIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(CLAIM_FLAG_KEY) === '1') return

  const user = db.cloud.currentUser.value
  if (!user.isLoggedIn || !user.userId) return

  const userId = user.userId
  const tables = [db.mealPlans, db.savedMeals, db.recipes, db.profiles] as const

  await db.transaction('rw', tables, async () => {
    for (const table of tables) {
      const rows = (await table.toArray()) as CloudEntity[]
      for (const row of rows) {
        if (!row.owner || row.owner === 'unauthorized') {
          await table.put({
            ...row,
            owner: userId,
            realmId: userId,
          } as never)
        }
      }
    }
  })

  localStorage.setItem(CLAIM_FLAG_KEY, '1')

  try {
    await db.cloud.sync()
  } catch {
    // Sync may fail offline; data is claimed locally and will push when online.
  }
}
