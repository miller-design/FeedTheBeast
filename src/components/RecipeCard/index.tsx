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
 * Compact recipe summary card. Opens the detail panel on click.
 *
 * @param props.recipe - Saved recipe to display
 * @param props.onSelect - Called when the user opens the recipe detail panel
 *
 * @example
 * <RecipeCard recipe={recipe} onSelect={setSelectedRecipe} />
 */
const RecipeCard = ({ recipe, onSelect }: RecipeCardProps) => {
  const tags = safeTags(recipe.tags)

  return (
    <li className={`${workspaceStyles.card} ${styles.root}`}>
      <button
        type="button"
        className={styles.openBtn}
        onClick={() => onSelect(recipe)}
      >
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
            {recipe.nutrition.calories} kcal/serving · {recipe.servings} servings
            {recipe.ingredients.length > 0 &&
              ` · ${recipe.ingredients.length} ingredients`}
          </span>
          {recipe.sourceSite && (
            <span className={styles.source}>{recipe.sourceSite}</span>
          )}
        </span>

        <span className={styles.viewHint}>View recipe →</span>
      </button>
    </li>
  )
}

export default RecipeCard
