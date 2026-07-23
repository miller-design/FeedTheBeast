import type { RecipeTag } from '#/lib/recipe-tags'

export type RecipeTagPickerProps = {
  value: RecipeTag[]
  onChange: (tags: RecipeTag[]) => void
  /** Optional field legend e.g. `"Meal types"` */
  label?: string
  /** Optional helper text under the chips */
  hint?: string
  /** Disables chip toggles while a save is in flight */
  disabled?: boolean
}
