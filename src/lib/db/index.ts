import Dexie from 'dexie'
import type { Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

import type { MealPlan, SavedMeal } from '#/types/meal-plan'
import type { UserProfile } from '#/types/profile'
import type { Recipe } from '#/types/recipe'

/**
 * IndexedDB database for meal planner data, synced via Dexie Cloud when configured.
 *
 * Auth is required (`requireAuth: true`) once `VITE_DEXIE_CLOUD_URL` is set — there is
 * no guest / local-only mode.
 *
 * @example
 * await db.mealPlans.toArray()
 */
export class FeedTheBeastDB extends Dexie {
  mealPlans!: Table<MealPlan, string>
  savedMeals!: Table<SavedMeal, string>
  recipes!: Table<Recipe, string>
  profiles!: Table<UserProfile, string>

  constructor() {
    super('FeedTheBeastDB', { addons: [dexieCloud] })
    this.version(1).stores({
      mealPlans: 'id, name, createdAt, updatedAt',
      savedMeals: 'id, name, createdAt',
    })
    this.version(2).stores({
      mealPlans: 'id, name, createdAt, updatedAt',
      savedMeals: 'id, name, createdAt',
      recipes: 'id, name, sourceSite, createdAt, updatedAt',
    })
    this.version(3).stores({
      mealPlans: 'id, name, createdAt, updatedAt',
      savedMeals: 'id, name, createdAt',
      recipes: 'id, name, sourceSite, createdAt, updatedAt',
      profiles: 'id, username, updatedAt',
    })

    const databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL ?? ''
    if (typeof window !== 'undefined' && databaseUrl.trim()) {
      this.cloud.configure({
        databaseUrl: databaseUrl.trim(),
        requireAuth: true,
        customLoginGui: true,
      })
    }
  }
}

export const db = new FeedTheBeastDB()

/** True when a Dexie Cloud database URL is configured for this build. */
export function isCloudConfigured(): boolean {
  return Boolean((import.meta.env.VITE_DEXIE_CLOUD_URL ?? '').trim())
}
