import type { RecipeTag } from '#/lib/recipe-tags'

export type RecipeCategoryFilterProps = {
  /** Currently selected category tags e.g. `['breakfast', 'dinner']` */
  value: RecipeTag[]
  /** Called with the updated tag list after each toggle */
  onChange: (tags: RecipeTag[]) => void
  /** How many recipes have each tag e.g. `{ breakfast: 3, lunch: 0 }` */
  counts: Record<RecipeTag, number>
  /** Recipes with no meal-type tags */
  untaggedCount: number
  /** Whether untagged recipes are included in the filter */
  includeUntagged: boolean
  /** Called when the untagged chip is toggled */
  onIncludeUntaggedChange: (include: boolean) => void
}
