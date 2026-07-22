import type { FoodEntry } from '#/types/meal-plan'

export type FoodSearchModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (entry: FoodEntry) => void
}
