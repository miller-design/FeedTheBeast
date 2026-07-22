import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  deleteMealPlan,
  getAllMealPlanSlugs,
  getAllMealPlans,
  saveMealPlan,
} from '#/lib/db/meal-plans'
import { createMealPlan } from '#/lib/meal-plan-factory'
import { ensureUniquePlanSlug, slugify } from '#/lib/slug'
import type { CreatePlanInput } from '#/types/meal-plan'

/**
 * Hook for listing and creating meal plans from the home dashboard.
 * Uses a live Dexie query so synced remote changes refresh the UI.
 *
 * @returns Plans array, loading state, and CRUD helpers
 *
 * @example
 * const { plans, loading, createPlan, removePlan } = useMealPlans()
 */
export function useMealPlans() {
  const plans = useLiveQuery(() => getAllMealPlans(), [])
  const loading = plans === undefined

  /**
   * Creates and persists a new meal plan with a unique URL slug.
   *
   * @param input - Plan creation form values
   * @returns The new plan's slug for navigation
   */
  const createPlan = useCallback(async (input: CreatePlanInput): Promise<string> => {
    const existingSlugs = await getAllMealPlanSlugs()
    const slug = ensureUniquePlanSlug(slugify(input.name), existingSlugs)
    const plan = createMealPlan(input, slug)
    await saveMealPlan(plan)
    return plan.slug
  }, [])

  /**
   * Deletes a plan. The live query refreshes automatically.
   *
   * @param id - Plan UUID to delete
   */
  const removePlan = useCallback(async (id: string) => {
    await deleteMealPlan(id)
  }, [])

  return {
    plans: plans ?? [],
    loading,
    createPlan,
    removePlan,
  }
}
