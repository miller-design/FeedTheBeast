import type { FoodEntry, PlanDay } from '#/types/meal-plan'

export type DayRowProps = {
  day: PlanDay
  dayIndex: number
  readOnly?: boolean
  selectedItemId?: string | null
  onSelectItem?: (item: FoodEntry) => void
  onCalorieTargetChange: (target: number) => void
  onRemoveItem: (slotIndex: number, itemId: string) => void
}
