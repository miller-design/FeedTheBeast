import type { Recipe } from '#/types/recipe'

export type RecipeCardProps = {
  recipe: Recipe
  onSelect: (recipe: Recipe) => void
}
