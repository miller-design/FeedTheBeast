import { useCallback, useEffect, useState } from 'react'

import {
  getMealPlanById,
  updateMealPlan,
} from '#/lib/db/meal-plans'
import type { MealPlan } from '#/types/meal-plan'

/**
 * Hook for loading and persisting a single meal plan in the editor.
 *
 * @param planId - UUID of the plan to edit
 * @returns Plan data, loading state, and save helper
 *
 * @example
 * const { plan, loading, savePlan, setPlan } = useMealPlan('abc-123')
 */
export function useMealPlan(planId: string) {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const data = await getMealPlanById(planId)
      if (active) {
        setPlan(data ?? null)
        setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [planId])

  /**
   * Persists the current plan state to IndexedDB.
   *
   * @param updated - Modified meal plan
   */
  const savePlan = useCallback(async (updated: MealPlan) => {
    setSaving(true)
    await updateMealPlan(updated)
    setPlan(updated)
    setSaving(false)
  }, [])

  return { plan, loading, saving, savePlan, setPlan }
}
