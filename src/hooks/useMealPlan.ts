import { useCallback, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { getMealPlanById, updateMealPlan } from '#/lib/db/meal-plans'
import type { MealPlan } from '#/types/meal-plan'

/**
 * Hook for loading and persisting a single meal plan in the editor.
 * Subscribes via live query so remote sync updates appear automatically.
 *
 * @param planId - UUID of the plan to edit
 * @returns Plan data, loading state, and save helper
 *
 * @example
 * const { plan, loading, savePlan } = useMealPlan('abc-123')
 */
export function useMealPlan(planId: string) {
  const plan = useLiveQuery(() => getMealPlanById(planId), [planId])
  const [saving, setSaving] = useState(false)

  const loading = plan === undefined

  /**
   * Persists the current plan state to IndexedDB (and syncs via Dexie Cloud).
   *
   * @param updated - Modified meal plan
   */
  const savePlan = useCallback(async (updated: MealPlan) => {
    setSaving(true)
    try {
      await updateMealPlan(updated)
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    plan: plan ?? null,
    loading,
    saving,
    savePlan,
  }
}
