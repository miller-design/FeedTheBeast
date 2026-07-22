import type { FoodEntry, MealSlot } from '#/types/meal-plan'

export type MealDropZoneProps = {
  slot: MealSlot
  dayIndex: number
  slotIndex: number
  readOnly?: boolean
  selectedItemId?: string | null
  onSelectItem?: (item: FoodEntry) => void
  onRemoveItem: (itemId: string) => void
}
