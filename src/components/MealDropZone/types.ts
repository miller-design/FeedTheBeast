import type { FoodEntry, MealSlot } from '#/types/meal-plan'

export type MealDropZoneProps = {
  slot: MealSlot
  dayIndex: number
  slotIndex: number
  readOnly?: boolean
  selectedItemId?: string | null
  onSelectItem?: (item: FoodEntry) => void
  onRemoveItem: (itemId: string) => void
  /** When set, the zone is in tap-to-place mode and can receive a tap. */
  placementActive?: boolean
  /** Called when the user taps this zone while placement is active. */
  onPlaceHere?: () => void
  /** Called when a meal item is tapped to start move-via-tap placement. */
  onRequestMove?: (item: FoodEntry) => void
}
