import clsx from 'clsx'

import {
  RECIPE_TAGS,
  RECIPE_TAG_LABELS,
  toggleRecipeTag,
} from '#/lib/recipe-tags'

import type { RecipeCategoryFilterProps } from './types'
import styles from './styles.module.css'

/**
 * Chip filter for recipe meal-type categories, with per-category counts.
 *
 * Selecting one or more chips filters the library (OR). When none are selected
 * and untagged is off, every recipe is shown.
 *
 * @param props.value - Selected category tags e.g. `['breakfast']`
 * @param props.onChange - Called with the updated tag list after each toggle
 * @param props.counts - Recipe counts per tag e.g. `{ breakfast: 3, lunch: 1, ... }`
 * @param props.untaggedCount - How many recipes have no tags
 * @param props.includeUntagged - Whether the untagged chip is active
 * @param props.onIncludeUntaggedChange - Called when untagged is toggled
 *
 * @example
 * <RecipeCategoryFilter
 *   value={tagFilters}
 *   onChange={setTagFilters}
 *   counts={tagCounts}
 *   untaggedCount={2}
 *   includeUntagged={showUntagged}
 *   onIncludeUntaggedChange={setShowUntagged}
 * />
 */
const RecipeCategoryFilter = ({
  value,
  onChange,
  counts,
  untaggedCount,
  includeUntagged,
  onIncludeUntaggedChange,
}: RecipeCategoryFilterProps) => {
  const hasActiveFilters = value.length > 0 || includeUntagged

  /**
   * Clears every category chip and the untagged filter.
   */
  function handleClear() {
    onChange([])
    onIncludeUntaggedChange(false)
  }

  return (
    <div className={styles.root}>
      <p className={styles.label} id="recipe-category-filter-label">
        Category
      </p>
      <div
        className={styles.chips}
        role="group"
        aria-labelledby="recipe-category-filter-label"
      >
        {RECIPE_TAGS.map((tag) => {
          const active = value.includes(tag)
          const count = counts[tag]

          return (
            <button
              key={tag}
              type="button"
              className={clsx(styles.chip, active && styles.chipActive)}
              aria-pressed={active}
              onClick={() => onChange(toggleRecipeTag(value, tag))}
            >
              {RECIPE_TAG_LABELS[tag]}{' '}
              <span className={styles.count}>({count})</span>
            </button>
          )
        })}

        {untaggedCount > 0 && (
          <button
            type="button"
            className={clsx(styles.chip, includeUntagged && styles.chipActive)}
            aria-pressed={includeUntagged}
            onClick={() => onIncludeUntaggedChange(!includeUntagged)}
          >
            Untagged <span className={styles.count}>({untaggedCount})</span>
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <button type="button" className={styles.clear} onClick={handleClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}

export default RecipeCategoryFilter
