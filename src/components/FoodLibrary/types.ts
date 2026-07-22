import type { Recipe } from '#/types/recipe'

export type FoodLibraryProps = {
  recipes: Recipe[]
  onManualFood: () => void
}
