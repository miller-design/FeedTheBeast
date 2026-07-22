import { db } from '#/lib/db'
import type { MealPlan, SavedMeal } from '#/types/meal-plan'

/**
 * Retrieves all meal plans sorted by most recently updated.
 *
 * @returns Array of meal plans
 */
export async function getAllMealPlans(): Promise<MealPlan[]> {
  return db.mealPlans.orderBy('updatedAt').reverse().toArray()
}

/**
 * Fetches a single meal plan by ID.
 *
 * @param id - Meal plan UUID
 * @returns Plan or undefined if not found
 *
 * @example
 * const plan = await getMealPlanById('abc-123')
 */
export async function getMealPlanById(
  id: string,
): Promise<MealPlan | undefined> {
  return db.mealPlans.get(id)
}

/**
 * Fetches a single meal plan by its URL slug.
 *
 * @param slug - Unique plan slug e.g. `"week-1-cut"`
 * @returns Plan or undefined if not found
 *
 * @example
 * const plan = await getMealPlanBySlug('week-1-cut')
 */
export async function getMealPlanBySlug(
  slug: string,
): Promise<MealPlan | undefined> {
  return db.mealPlans.where('slug').equals(slug).first()
}

/**
 * Collects every plan slug currently stored (for uniqueness checks).
 *
 * @returns Array of slug strings
 *
 * @example
 * const slugs = await getAllMealPlanSlugs()
 */
export async function getAllMealPlanSlugs(): Promise<string[]> {
  const keys = await db.mealPlans.orderBy('slug').keys()
  return keys.filter((key): key is string => typeof key === 'string')
}

/**
 * Persists a new meal plan to IndexedDB.
 *
 * @param plan - Complete meal plan object
 * @returns The stored plan ID
 */
export async function saveMealPlan(plan: MealPlan): Promise<string> {
  await db.mealPlans.put(plan)
  return plan.id
}

/**
 * Updates an existing meal plan with a fresh updatedAt timestamp.
 *
 * @param plan - Modified meal plan
 */
export async function updateMealPlan(plan: MealPlan): Promise<void> {
  await db.mealPlans.put({
    ...plan,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Deletes a meal plan by ID.
 *
 * @param id - Meal plan UUID to remove
 */
export async function deleteMealPlan(id: string): Promise<void> {
  await db.mealPlans.delete(id)
}

/**
 * Retrieves all saved meal templates.
 *
 * @returns Array of saved meals sorted by name
 */
export async function getAllSavedMeals(): Promise<SavedMeal[]> {
  return db.savedMeals.orderBy('name').toArray()
}

/**
 * Saves a reusable meal template.
 *
 * @param meal - Saved meal object
 */
export async function saveSavedMeal(meal: SavedMeal): Promise<void> {
  await db.savedMeals.put(meal)
}

/**
 * Deletes a saved meal template.
 *
 * @param id - Saved meal UUID
 */
export async function deleteSavedMeal(id: string): Promise<void> {
  await db.savedMeals.delete(id)
}
