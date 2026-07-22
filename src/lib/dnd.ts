/** Drag-and-drop item type identifiers */
export const DND_TYPES = {
  LIBRARY_FOOD: 'library-food',
  LIBRARY_RECIPE: 'library-recipe',
  MEAL_ITEM: 'meal-item',
} as const

export type DndType = (typeof DND_TYPES)[keyof typeof DND_TYPES]

/** Payload when dragging a food from the library sidebar */
export type LibraryFoodDragData = {
  type: typeof DND_TYPES.LIBRARY_FOOD
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: number
  unit: string
  source: 'manual' | 'openfoodfacts'
  barcode?: string
  servingSizeG?: number
}

/** Payload when dragging a recipe from the library sidebar */
export type LibraryRecipeDragData = {
  type: typeof DND_TYPES.LIBRARY_RECIPE
  recipeId: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servings: number
}

/** Payload when dragging an existing item within the plan */
export type MealItemDragData = {
  type: typeof DND_TYPES.MEAL_ITEM
  itemId: string
  dayIndex: number
  slotIndex: number
  name: string
  calories: number
}

export type DragData =
  | LibraryFoodDragData
  | LibraryRecipeDragData
  | MealItemDragData

/** Drop zone identifier for a meal slot */
export type DropTarget = {
  dayIndex: number
  slotIndex: number
}

/**
 * Builds a unique droppable ID for a meal slot.
 *
 * @param dayIndex - Index of the day in the plan
 * @param slotIndex - Index of the meal slot within the day
 * @returns Droppable ID string e.g. `"day-0-slot-2"`
 *
 * @example
 * mealSlotDropId(0, 1) // "day-0-slot-1"
 */
export function mealSlotDropId(dayIndex: number, slotIndex: number): string {
  return `day-${dayIndex}-slot-${slotIndex}`
}

/**
 * Parses a droppable ID back into day and slot indices.
 *
 * @param id - Droppable ID from mealSlotDropId
 * @returns Indices or null if invalid
 */
export function parseMealSlotDropId(id: string): DropTarget | null {
  const match = id.match(/^day-(\d+)-slot-(\d+)$/)
  if (!match) return null
  return { dayIndex: Number(match[1]), slotIndex: Number(match[2]) }
}
