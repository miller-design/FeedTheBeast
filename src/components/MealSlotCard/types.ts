import type { FoodEntry, MealSlot, SavedMeal } from '#/types/meal-plan'

export type MealSlotCardProps = {
  slot: MealSlot
  savedMeals: SavedMeal[]
  onAddItem: (entry: FoodEntry) => void
  onRemoveItem: (itemId: string) => void
  onSaveAsTemplate?: (slot: MealSlot) => void
  foodModalOpen: boolean
  onOpenFoodModal: () => void
  onCloseFoodModal: () => void
}
