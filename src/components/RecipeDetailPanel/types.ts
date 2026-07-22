import type { Recipe } from '#/types/recipe'

export type RecipeDetailPanelProps = {
  recipe: Recipe | null
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}
