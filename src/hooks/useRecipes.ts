import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  createRecipeFromImport,
  createRecipeFromInput,
  deleteRecipe,
  getAllRecipes,
  saveRecipe,
} from '#/lib/db/recipes'
import type { CreateRecipeInput, ImportedRecipeDraft } from '#/types/recipe'

/**
 * Hook for managing the recipe library with live Dexie updates.
 *
 * @returns Recipes list and CRUD helpers
 *
 * @example
 * const { recipes, loading, addRecipe, removeRecipe } = useRecipes()
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
   * Saves an imported recipe draft.
   *
   * @param draft - Parsed URL import data
   * @returns New recipe ID
   */
  const addImportedRecipe = useCallback(
    async (draft: ImportedRecipeDraft): Promise<string> => {
      const recipe = createRecipeFromImport(draft)
      await saveRecipe(recipe)
      return recipe.id
    },
    [],
  )

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
    removeRecipe,
  }
}
