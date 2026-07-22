import Dexie from 'dexie'
import type { Table, Transaction } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

import { ensureUniquePlanSlug, slugify } from '#/lib/slug'
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
    this.version(4)
      .stores({
        mealPlans: 'id, slug, name, createdAt, updatedAt',
        savedMeals: 'id, name, createdAt',
        recipes: 'id, name, sourceSite, createdAt, updatedAt',
        profiles: 'id, username, updatedAt',
      })
      .upgrade(async (tx) => {
        await backfillMealPlanSlugs(tx)
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

/**
 * Assigns unique slugs to meal plans that predate the slug field.
 *
 * @param tx - Dexie upgrade transaction for version 4
 */
async function backfillMealPlanSlugs(tx: Transaction): Promise<void> {
  const table = tx.table('mealPlans')
  const plans = (await table.toArray()) as Array<Partial<MealPlan> & { id: string; name: string }>
  const used = new Set<string>()

  for (const plan of plans) {
    if (typeof plan.slug === 'string' && plan.slug.length > 0) {
      used.add(plan.slug)
    }
  }

  for (const plan of plans) {
    if (typeof plan.slug === 'string' && plan.slug.length > 0) {
      continue
    }
    const slug = ensureUniquePlanSlug(slugify(plan.name), used)
    used.add(slug)
    await table.update(plan.id, { slug })
  }
}

export const db = new FeedTheBeastDB()

/** True when a Dexie Cloud database URL is configured for this build. */
export function isCloudConfigured(): boolean {
  return Boolean((import.meta.env.VITE_DEXIE_CLOUD_URL ?? '').trim())
}
