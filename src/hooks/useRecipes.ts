import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  createRecipeFromImport,
  createRecipeFromInput,
  deleteRecipe,
  findRecipeBySourceUrl,
  getAllRecipes,
  saveRecipe,
  updateRecipe,
  updateRecipeTags,
} from '#/lib/db/recipes'
import type { RecipeTag } from '#/lib/recipe-tags'
import type { CreateRecipeInput, ImportedRecipeDraft, UpdateRecipeInput } from '#/types/recipe'

/**
 * Hook for managing the recipe library with live Dexie updates.
 *
 * @returns Recipes list and CRUD helpers
 *
 * @example
 * const { recipes, loading, addRecipe, removeRecipe, setRecipeTags } = useRecipes()
 */
export function useRecipes() {
  const recipes = useLiveQuery(() => getAllRecipes(), [])
  const loading = recipes === undefined

  /**
   * Saves a manually created recipe.
   *
   * @param input - Recipe form values
   * @returns New recipe ID
   */
  const addRecipe = useCallback(async (input: CreateRecipeInput): Promise<string> => {
    const recipe = createRecipeFromInput(input)
    await saveRecipe(recipe)
    return recipe.id
  }, [])

  /**
   * Saves an imported recipe draft unless the source URL already exists.
   *
   * @param draft - Parsed URL import data
   * @returns New recipe ID, or existing recipe ID when duplicate
   * @throws Error when the same source URL is already in the library
   */
  const addImportedRecipe = useCallback(
    async (draft: ImportedRecipeDraft): Promise<string> => {
      if (draft.sourceUrl) {
        const existing = await findRecipeBySourceUrl(draft.sourceUrl)
        if (existing) {
          throw new Error(`Already in your library: ${existing.name}`)
        }
      }

      const recipe = createRecipeFromImport(draft)
      await saveRecipe(recipe)
      return recipe.id
    },
    [],
  )

  /**
   * Looks up a recipe previously imported from the same URL.
   *
   * @param sourceUrl - Recipe page URL
   * @returns Existing recipe, if any
   */
  const getImportedRecipeByUrl = useCallback(async (sourceUrl: string) => {
    return findRecipeBySourceUrl(sourceUrl)
  }, [])

  /**
   * Updates editable recipe fields from the detail panel.
   *
   * @param id - Recipe UUID
   * @param input - Edited name, servings, nutrition, ingredients, and method
   */
  const editRecipe = useCallback(async (id: string, input: UpdateRecipeInput) => {
    await updateRecipe(id, input)
  }, [])

  /**
   * Updates meal-type tags on a recipe (manual backfill / edits).
   *
   * @param id - Recipe UUID
   * @param tags - Controlled tags e.g. `['breakfast']`
   */
  const setRecipeTags = useCallback(async (id: string, tags: RecipeTag[]) => {
    await updateRecipeTags(id, tags)
  }, [])

  /**
   * Deletes a recipe from the library.
   *
   * @param id - Recipe UUID
   */
  const removeRecipe = useCallback(async (id: string) => {
    await deleteRecipe(id)
  }, [])

  return {
    recipes: recipes ?? [],
    loading,
    addRecipe,
    addImportedRecipe,
    getImportedRecipeByUrl,
    editRecipe,
    setRecipeTags,
    removeRecipe,
  }
}
