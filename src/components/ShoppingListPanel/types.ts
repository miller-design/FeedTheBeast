import type { ShoppingListGroup } from '#/types/shopping-list'

export type ShoppingListPanelProps = {
  /** Whether the panel is visible */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Meal plan used to build the list */
  planName: string
  /** Pre-built aisle groups from `buildShoppingList` */
  groups: ShoppingListGroup[]
}
