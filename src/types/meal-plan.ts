/** Source of nutrition data for a food entry */
export type FoodSource = 'manual' | 'openfoodfacts' | 'recipe'

/** A single food item within a meal slot */
export type FoodEntry = {
  id: string
  name: string
  /** Calories per serving (quantity × unit) */
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: number
  unit: string
  /** Gram weight of one serving, used for OFF scaling */
  servingSizeG?: number
  source: FoodSource
  barcode?: string
  /** Reference to a recipe when source is 'recipe' */
  recipeId?: string
  /** Number of recipe servings added to the meal */
  recipeServings?: number
}

/** Named meal slot within a day (e.g. Breakfast, Lunch) */
export type MealSlot = {
  id: string
  name: string
  items: FoodEntry[]
}

/** One day within a meal plan */
export type PlanDay = {
  date: string
  calorieTarget: number
  meals: MealSlot[]
}

/** Full meal plan stored in IndexedDB */
export type MealPlan = {
  id: string
  /** URL-safe unique slug derived from `name` */
  slug: string
  name: string
  startDate: string
  days: PlanDay[]
  defaultCalorieTarget: number
  createdAt: string
  updatedAt: string
}

/** Reusable meal template saved by the user */
export type SavedMeal = {
  id: string
  name: string
  items: FoodEntry[]
  createdAt: string
}

/** Nutrition totals aggregated from food entries */
export type NutritionTotals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Duration presets when creating a new plan */
export type PlanDurationPreset = '1' | '2' | '7' | '14' | '30' | 'custom'

/** Form values for creating a new meal plan */
export type CreatePlanInput = {
  name: string
  startDate: string
  durationDays: number
  defaultCalorieTarget: number
}

/** Open Food Facts search result mapped to app shape */
export type OffSearchResult = {
  barcode: string
  name: string
  brand?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  servingSizeG?: number
  servingQuantity?: number
}
