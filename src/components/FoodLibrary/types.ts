import type {
  LibraryFoodDragData,
  LibraryRecipeDragData,
} from '#/lib/dnd'
import type { Recipe } from '#/types/recipe'

/** Payload for tap-to-place from the food library (food or recipe). */
export type LibraryPlacePayload = LibraryFoodDragData | LibraryRecipeDragData

export type FoodLibraryProps = {
  recipes: Recipe[]
  onManualFood: () => void
  /**
   * Called when the user taps the add control on a library item
   * (touch-friendly alternative to drag-and-drop).
   */
  onPlaceRequest?: (payload: LibraryPlacePayload) => void
  /** Below `--bp-xl`, controls whether the drawer is open. */
  mobileOpen?: boolean
  /** Closes the mobile drawer (backdrop / close button). */
  onMobileClose?: () => void
}
