import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  deleteMealPlan,
  getAllMealPlans,
  saveMealPlan,
} from '#/lib/db/meal-plans'
import { createMealPlan } from '#/lib/meal-plan-factory'
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
   * Creates and persists a new meal plan.
   *
   * @param input - Plan creation form values
   * @returns The new plan's ID
   */
  const createPlan = useCallback(async (input: CreatePlanInput): Promise<string> => {
    const plan = createMealPlan(input)
    await saveMealPlan(plan)
    return plan.id
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
