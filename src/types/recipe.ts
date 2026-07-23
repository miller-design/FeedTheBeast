import type { RecipeTag } from '#/lib/recipe-tags'

/** A single ingredient line in a recipe */
export type RecipeIngredient = {
  id: string
  text: string
  quantity?: number
  unit?: string
}

/** Nutrition values per serving */
export type RecipeNutrition = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** A user-built or imported recipe stored in the library */
export type Recipe = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  sourceUrl?: string
  sourceSite?: string
  servings: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  ingredients: RecipeIngredient[]
  instructions: string[]
  nutrition: RecipeNutrition
  /** Controlled meal-type tags; empty when untagged */
  tags: RecipeTag[]
  createdAt: string
  updatedAt: string
}

/** Parsed recipe data returned from URL import before saving */
export type ImportedRecipeDraft = {
  name: string
  description?: string
  imageUrl?: string
  /** Original page URL when known; omitted for anonymous JSON-LD pastes */
  sourceUrl?: string
  sourceSite?: string
  servings: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  ingredients: string[]
  instructions: string[]
  nutrition: RecipeNutrition
  /** Suggested/edited meal-type tags before save */
  tags: RecipeTag[]
}

/** Form values for manually creating a recipe */
export type CreateRecipeInput = {
  name: string
  servings: number
  description?: string
  ingredients: string[]
  instructions: string[]
  nutrition: RecipeNutrition
  tags: RecipeTag[]
}

/** Form values for editing an existing recipe */
export type UpdateRecipeInput = {
  name: string
  servings: number
  ingredients: string[]
  instructions: string[]
  nutrition: RecipeNutrition
}
