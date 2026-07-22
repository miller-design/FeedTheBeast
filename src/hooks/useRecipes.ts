import { useCallback, useEffect, useState } from 'react'

import {
  createRecipeFromImport,
  createRecipeFromInput,
  deleteRecipe,
  getAllRecipes,
  saveRecipe,
} from '#/lib/db/recipes'
import type { CreateRecipeInput, ImportedRecipeDraft, Recipe } from '#/types/recipe'

/**
 * Hook for managing the recipe library.
 *
 * @returns Recipes list and CRUD helpers
 *
 * @example
 * const { recipes, loading, addRecipe, removeRecipe } = useRecipes()
 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getAllRecipes()
    setRecipes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /**
   * Saves a manually created recipe.
   *
   * @param input - Recipe form values
   * @returns New recipe ID
   */
  const addRecipe = useCallback(
    async (input: CreateRecipeInput): Promise<string> => {
      const recipe = createRecipeFromInput(input)
      await saveRecipe(recipe)
      await refresh()
      return recipe.id
    },
    [refresh],
  )

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
      await refresh()
      return recipe.id
    },
    [refresh],
  )

  /**
   * Deletes a recipe from the library.
   *
   * @param id - Recipe UUID
   */
  const removeRecipe = useCallback(
    async (id: string) => {
      await deleteRecipe(id)
      await refresh()
    },
    [refresh],
  )

  return { recipes, loading, addRecipe, addImportedRecipe, removeRecipe, refresh }
}
