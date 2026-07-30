/** Grocery aisle used to group shopping-list lines */
export type ShoppingCategory =
  | 'produce'
  | 'meat_fish'
  | 'dairy_eggs'
  | 'bakery'
  | 'pantry'
  | 'spices'
  | 'frozen'
  | 'other'

/** A single aggregated line on the shopping list */
export type ShoppingListItem = {
  /** Stable key for React lists / checkboxes */
  id: string
  /** Human-readable product name (without qty/unit) */
  name: string
  /** Total amount after scaling and merging; omitted when unknown */
  quantity?: number
  /**
   * Measurement unit for `quantity` (e.g. tbsp, g, cup).
   * Omitted for countable items like "4 eggs" where quantity is a count.
   */
  unit?: string
  /** Piece count when a meat line also has a weight total (e.g. 750g + 4 thighs) */
  pieceCount?: number
  category: ShoppingCategory
  /** How many plan recipe uses contributed to this line */
  recipeCount: number
}

/** One aisle section in the shopping list */
export type ShoppingListGroup = {
  category: ShoppingCategory
  label: string
  items: ShoppingListItem[]
}
