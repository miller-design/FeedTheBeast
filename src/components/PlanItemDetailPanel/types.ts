import type { FoodEntry } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

export type PlanItemSelection = {
  item: FoodEntry
  recipe?: Recipe
}

export type PlanItemDetailPanelProps = {
  selection: PlanItemSelection | null
  onClose: () => void
}
