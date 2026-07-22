import type { MealSlot, PlanDay, SavedMeal } from '#/types/meal-plan'

export type DayPanelProps = {
  day: PlanDay
  dayIndex: number
  savedMeals: SavedMeal[]
  onUpdateDay: (dayIndex: number, day: PlanDay) => void
  onSaveMealTemplate?: (slot: MealSlot) => void
}
