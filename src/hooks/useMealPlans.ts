import { useCallback, useEffect, useState } from 'react'

import {
  deleteMealPlan,
  getAllMealPlans,
  saveMealPlan,
} from '#/lib/db/meal-plans'
import { createMealPlan } from '#/lib/meal-plan-factory'
import type { CreatePlanInput, MealPlan } from '#/types/meal-plan'

/**
 * Hook for listing and creating meal plans from the home dashboard.
 *
 * @returns Plans array, loading state, and CRUD helpers
 *
 * @example
 * const { plans, loading, createPlan, removePlan, refresh } = useMealPlans()
 */
export function useMealPlans() {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getAllMealPlans()
    setPlans(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /**
   * Creates and persists a new meal plan.
   *
   * @param input - Plan creation form values
   * @returns The new plan's ID
   */
  const createPlan = useCallback(
    async (input: CreatePlanInput): Promise<string> => {
      const plan = createMealPlan(input)
      await saveMealPlan(plan)
      await refresh()
      return plan.id
    },
    [refresh],
  )

  /**
   * Deletes a plan and refreshes the list.
   *
   * @param id - Plan UUID to delete
   */
  const removePlan = useCallback(
    async (id: string) => {
      await deleteMealPlan(id)
      await refresh()
    },
    [refresh],
  )

  return { plans, loading, createPlan, removePlan, refresh }
}
