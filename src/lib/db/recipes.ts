import { createId } from '#/lib/meal-plan-factory'
import { normalizeRecipeSourceUrl } from '#/lib/recipe-import'
import { db } from '#/lib/db/index'
import { normalizeRecipeTags, type RecipeTag } from '#/lib/recipe-tags'
import type { FoodEntry } from '#/types/meal-plan'
import type {
  CreateRecipeInput,
  ImportedRecipeDraft,
  Recipe,
  RecipeIngredient,
  UpdateRecipeInput,
} from '#/types/recipe'

/**
 * Retrieves all recipes sorted by most recently updated.
 *
 * @returns Array of recipes
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('updatedAt').reverse().toArray()
}

/**
 * Fetches a single recipe by ID.
 *
 * @param id - Recipe UUID
 * @returns Recipe or undefined
 */
export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

/**
 * Finds an existing recipe imported from the same source URL.
 *
 * @param sourceUrl - Recipe page URL (raw or normalised)
 * @returns Matching recipe, or undefined if not imported before
 *
 * @example
 * await findRecipeBySourceUrl('https://pinchofyum.com/granola-bars')
 */
export async function findRecipeBySourceUrl(
  sourceUrl: string,
): Promise<Recipe | undefined> {
  const normalized = normalizeRecipeSourceUrl(sourceUrl)
  const recipes = await db.recipes.toArray()

  return recipes.find(
    (recipe) =>
      recipe.sourceUrl &&
      normalizeRecipeSourceUrl(recipe.sourceUrl) === normalized,
  )
}

/**
 * Saves a new or updated recipe to IndexedDB.
 *
 * @param recipe - Complete recipe object
 */
export async function saveRecipe(recipe: Recipe): Promise<void> {
  await db.recipes.put(recipe)
}

/**
 * Deletes a recipe by ID.
 *
 * @param id - Recipe UUID
 */
export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

/**
 * Converts ingredient strings to structured ingredient objects.
 *
 * @param ingredients - Raw ingredient text lines
 * @returns Structured ingredients with IDs
 */
function mapIngredients(ingredients: string[]): RecipeIngredient[] {
  return ingredients
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ id: createId(), text }))
}

/**
 * Creates a Recipe from manual form input.
 *
 * @param input - Form values from recipe builder
 * @returns Complete Recipe object
 *
 * @example
 * createRecipeFromInput({ name: 'Mac and Cheese', servings: 4, ... })
 */
export function createRecipeFromInput(input: CreateRecipeInput): Recipe {
  const now = new Date().toISOString()

  return {
    id: createId(),
    name: input.name.trim(),
    description: input.description?.trim(),
    servings: input.servings,
    ingredients: mapIngredients(input.ingredients),
    instructions: input.instructions.map((s) => s.trim()).filter(Boolean),
    nutrition: input.nutrition,
    tags: normalizeRecipeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Creates a Recipe from an imported URL draft.
 *
 * @param draft - Parsed import data from schema.org
 * @returns Complete Recipe object ready to save
 *
 * @example
 * createRecipeFromImport(importedDraft)
 */
export function createRecipeFromImport(draft: ImportedRecipeDraft): Recipe {
  const now = new Date().toISOString()

  return {
    id: createId(),
    name: draft.name,
    description: draft.description,
    imageUrl: draft.imageUrl,
    sourceUrl: draft.sourceUrl,
    sourceSite: draft.sourceSite,
    servings: draft.servings,
    prepTimeMinutes: draft.prepTimeMinutes,
    cookTimeMinutes: draft.cookTimeMinutes,
    ingredients: mapIngredients(draft.ingredients),
    instructions: draft.instructions,
    nutrition: draft.nutrition,
    tags: normalizeRecipeTags(draft.tags),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Updates core recipe fields (name, servings, nutrition, ingredients, method).
 *
 * @param id - Recipe UUID
 * @param input - Edited form values e.g. `{ name: 'Burritos', servings: 4, nutrition: {...}, ... }`
 * @returns Updated recipe, or undefined if not found
 *
 * @example
 * await updateRecipe(recipeId, { name: 'Nacho beef burritos', servings: 4, ... })
 */
export async function updateRecipe(
  id: string,
  input: UpdateRecipeInput,
): Promise<Recipe | undefined> {
  const existing = await getRecipeById(id)
  if (!existing) return undefined

  const updated: Recipe = {
    ...existing,
    name: input.name.trim(),
    servings: input.servings,
    ingredients: mapIngredients(input.ingredients),
    instructions: input.instructions.map((step) => step.trim()).filter(Boolean),
    nutrition: input.nutrition,
    updatedAt: new Date().toISOString(),
  }

  await saveRecipe(updated)
  return updated
}

/**
 * Updates meal-type tags on an existing recipe.
 *
 * @param id - Recipe UUID
 * @param tags - Controlled tags to store e.g. `['breakfast', 'snack']`
 * @returns Updated recipe, or undefined if not found
 *
 * @example
 * await updateRecipeTags(recipeId, ['dinner'])
 */
export async function updateRecipeTags(
  id: string,
  tags: RecipeTag[],
): Promise<Recipe | undefined> {
  const existing = await getRecipeById(id)
  if (!existing) return undefined

  const updated: Recipe = {
    ...existing,
    tags: normalizeRecipeTags(tags),
    updatedAt: new Date().toISOString(),
  }

  await saveRecipe(updated)
  return updated
}

/**
 * Converts a recipe to a food entry for adding to a meal slot.
 *
 * @param recipe - Source recipe from library
 * @param servings - Number of servings to add (default 1)
 * @returns FoodEntry representing the recipe
 *
 * @example
 * recipeToFoodEntry(macAndCheese, 1)
 */
export function recipeToFoodEntry(
  recipe: Recipe,
  servings = 1,
): FoodEntry {
  const factor = servings / Math.max(recipe.servings, 1)

  return {
    id: createId(),
    name: recipe.name,
    calories: Math.round(recipe.nutrition.calories * factor),
    protein: Math.round(recipe.nutrition.protein * factor * 10) / 10,
    carbs: Math.round(recipe.nutrition.carbs * factor * 10) / 10,
    fat: Math.round(recipe.nutrition.fat * factor * 10) / 10,
    quantity: servings,
    unit: 'serving',
    source: 'recipe',
    recipeId: recipe.id,
    recipeServings: servings,
  }
}
