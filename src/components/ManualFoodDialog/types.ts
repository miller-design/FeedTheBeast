import type { FoodEntry } from '#/types/meal-plan'

export type ManualFoodDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (entry: FoodEntry) => void
}
