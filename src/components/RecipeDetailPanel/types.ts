import type { Recipe } from '#/types/recipe'
import type { RecipeTag } from '#/lib/recipe-tags'

export type RecipeDetailPanelProps = {
  recipe: Recipe | null
  onClose: () => void
  onDelete: (id: string) => Promise<void>
  /**
   * Persists meal-type tag edits for an existing recipe.
   *
   * @example
   * onUpdateTags={setRecipeTags}
   */
  onUpdateTags: (id: string, tags: RecipeTag[]) => Promise<void>
}
