import { generateDateRange } from '#/lib/dates'
import type {
  CreatePlanInput,
  FoodEntry,
  MealPlan,
  MealSlot,
  PlanDay,
} from '#/types/meal-plan'

/** Default meal slot names for a new plan day */
export const DEFAULT_MEAL_SLOTS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
] as const

/**
 * Creates a unique ID for database entities.
 *
 * @returns UUID string
 *
 * @example
 * createId() // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
export function createId(): string {
  return crypto.randomUUID()
}

/**
 * Builds default meal slots for a new plan day.
 *
 * @returns Array of empty meal slots with standard names
 */
export function createDefaultMealSlots(): MealSlot[] {
  return DEFAULT_MEAL_SLOTS.map((name) => ({
    id: createId(),
    name,
    items: [],
  }))
}

/**
 * Creates a single plan day with default meal slots and calorie target.
 *
 * @param date - ISO date string e.g. `"2026-07-22"`
 * @param calorieTarget - Daily calorie goal
 * @returns Populated PlanDay object
 *
 * @example
 * createPlanDay('2026-07-22', 2000)
 */
export function createPlanDay(date: string, calorieTarget: number): PlanDay {
  return {
    date,
    calorieTarget,
    meals: createDefaultMealSlots(),
  }
}

/**
 * Creates a new meal plan from user input.
 *
 * @param input - Plan creation form values
 * @returns Complete MealPlan ready for IndexedDB storage
 *
 * @example
 * createMealPlan({
 *   name: 'Week 1',
 *   startDate: '2026-07-22',
 *   durationDays: 7,
 *   defaultCalorieTarget: 2000,
 * })
 */
export function createMealPlan(input: CreatePlanInput): MealPlan {
  const now = new Date().toISOString()
  const dates = generateDateRange(input.startDate, input.durationDays)

  return {
    id: createId(),
    name: input.name,
    startDate: input.startDate,
    defaultCalorieTarget: input.defaultCalorieTarget,
    days: dates.map((date) =>
      createPlanDay(date, input.defaultCalorieTarget),
    ),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Deep-clones food entries with new IDs for reuse in another meal slot.
 *
 * @param items - Source food entries from a saved meal or another slot
 * @returns Cloned entries with fresh IDs
 *
 * @example
 * cloneFoodEntries(savedMeal.items)
 */
export function cloneFoodEntries(items: FoodEntry[]): FoodEntry[] {
  return items.map((item) => ({
    ...item,
    id: createId(),
  }))
}
