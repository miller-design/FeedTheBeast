import type { Recipe } from '#/types/recipe'

export type RecipeCardProps = {
  recipe: Recipe
  onSelect: (recipe: Recipe) => void
  /** When true, card toggles multi-select instead of opening detail. */
  selecting?: boolean
  /** Whether this recipe is in the current multi-select set. */
  selected?: boolean
  /** Called when the user toggles this card in select mode. */
  onToggleSelect?: (id: string) => void
}
