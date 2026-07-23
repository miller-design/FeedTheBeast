import clsx from 'clsx'

import {
  RECIPE_TAGS,
  RECIPE_TAG_LABELS,
  toggleRecipeTag,
} from '#/lib/recipe-tags'

import type { RecipeTagPickerProps } from './types'
import styles from './styles.module.css'

/**
 * Multi-select chip picker for controlled recipe meal-type tags.
 *
 * @param props.value - Currently selected tags e.g. `['breakfast', 'snack']`
 * @param props.onChange - Called with the updated tag list after each toggle
 * @param props.label - Optional legend text (defaults to `"Meal types"`)
 * @param props.hint - Optional helper copy under the chips
 * @param props.disabled - When true, chips cannot be toggled
 *
 * @example
 * <RecipeTagPicker value={tags} onChange={setTags} hint="Optional — helps when planning meals." />
 */
const RecipeTagPicker = ({
  value,
  onChange,
  label = 'Meal types',
  hint,
  disabled = false,
}: RecipeTagPickerProps) => {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.chips} role="group" aria-label={label}>
        {RECIPE_TAGS.map((tag) => {
          const active = value.includes(tag)

          return (
            <button
              key={tag}
              type="button"
              className={clsx(styles.chip, active && styles.chipActive)}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(toggleRecipeTag(value, tag))}
            >
              {RECIPE_TAG_LABELS[tag]}
            </button>
          )
        })}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </fieldset>
  )
}

export default RecipeTagPicker
