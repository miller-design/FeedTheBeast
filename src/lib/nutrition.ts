import type { FoodEntry, NutritionTotals } from '#/types/meal-plan'

/**
 * Sums nutrition values across a list of food entries.
 *
 * @param items - Food entries to aggregate
 * @returns Totals for calories, protein, carbs, and fat
 *
 * @example
 * sumNutrition([{ calories: 200, protein: 10, carbs: 20, fat: 5, ... }])
 * // { calories: 200, protein: 10, carbs: 20, fat: 5 }
 */
export function sumNutrition(items: FoodEntry[]): NutritionTotals {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
      fat: totals.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/**
 * Calculates nutrition for a given gram weight from per-100g values.
 *
 * @param per100g - Macro values per 100g
 * @param grams - Weight in grams
 * @returns Scaled nutrition totals
 *
 * @example
 * scaleFrom100g({ calories: 250, protein: 10, carbs: 30, fat: 8 }, 150)
 * // { calories: 375, protein: 15, carbs: 45, fat: 12 }
 */
export function scaleFrom100g(
  per100g: NutritionTotals,
  grams: number,
): NutritionTotals {
  const factor = grams / 100
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
  }
}

/**
 * Returns a percentage of calorie target consumed (0–100+).
 *
 * @param consumed - Calories eaten so far
 * @param target - Daily calorie target
 * @returns Percentage value
 *
 * @example
 * calorieProgress(1800, 2000) // 90
 */
export function calorieProgress(consumed: number, target: number): number {
  if (target <= 0) return 0
  return Math.round((consumed / target) * 100)
}
