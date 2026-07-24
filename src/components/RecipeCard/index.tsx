import { RECIPE_TAG_LABELS, type RecipeTag } from '#/lib/recipe-tags'
import workspaceStyles from '#/styles/workspace-page.module.css'

import type { RecipeCardProps } from './types'
import styles from './styles.module.css'

/**
 * Returns tags for a recipe, defaulting to [] for legacy records.
 *
 * @param tags - Recipe tags that may be missing on older records
 * @returns Controlled tags
 */
function safeTags(tags: RecipeTag[] | undefined): RecipeTag[] {
  return Array.isArray(tags) ? tags : []
}

/**
 * Compact recipe summary card. Opens the detail panel on click, or toggles
 * selection when the parent page is in multi-select mode.
 *
 * @param props.recipe - Saved recipe to display
 * @param props.onSelect - Called when the user opens the recipe detail panel
 * @param props.selecting - When true, click toggles multi-select instead of opening
 * @param props.selected - Whether this recipe is currently selected
 * @param props.onToggleSelect - Called with the recipe ID when selection toggles
 *
 * @example
 * <RecipeCard
 *   recipe={recipe}
 *   onSelect={setSelectedRecipe}
 *   selecting={selecting}
 *   selected={isSelected(recipe.id)}
 *   onToggleSelect={toggle}
 * />
 */
const RecipeCard = ({
  recipe,
  onSelect,
  selecting = false,
  selected = false,
  onToggleSelect,
}: RecipeCardProps) => {
  const tags = safeTags(recipe.tags)

  const cardClassName = [
    workspaceStyles.card,
    styles.root,
    selecting && selected ? workspaceStyles.cardSelected : '',
  ]
    .filter(Boolean)
    .join(' ')

  /**
   * Opens the detail panel, or toggles multi-select when selecting is active.
   */
  function handleActivate() {
    if (selecting) {
      onToggleSelect?.(recipe.id)
      return
    }
    onSelect(recipe)
  }

  return (
    <li className={cardClassName}>
      <button
        type="button"
        className={selecting ? workspaceStyles.cardSelect : styles.openBtn}
        onClick={handleActivate}
        aria-pressed={selecting ? selected : undefined}
      >
        {selecting && (
          <input
            type="checkbox"
            className={workspaceStyles.cardCheckbox}
            checked={selected}
            readOnly
            tabIndex={-1}
            aria-hidden
          />
        )}

        <span className={styles.body}>
          <span className={styles.header}>
            <span className={styles.name}>{recipe.name}</span>
            {tags.length > 0 && (
              <span className={styles.tags}>
                {tags.map((tag) => RECIPE_TAG_LABELS[tag]).join(' · ')}
              </span>
            )}
          </span>

          <span className={styles.details}>
            <span className={styles.meta}>
              {recipe.nutrition.calories} kcal/serving · {recipe.servings}{' '}
              servings
              {recipe.ingredients.length > 0 &&
                ` · ${recipe.ingredients.length} ingredients`}
            </span>
            {recipe.sourceSite && (
              <span className={styles.source}>{recipe.sourceSite}</span>
            )}
          </span>

          {!selecting && (
            <span className={styles.viewHint}>View recipe →</span>
          )}
        </span>
      </button>
    </li>
  )
}

export default RecipeCard
