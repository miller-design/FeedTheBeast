import workspaceStyles from '#/styles/workspace-page.module.css'

import type { RecipeCardProps } from './types'
import styles from './styles.module.css'

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
  return (
    <li className={workspaceStyles.card}>
      <button
        type="button"
        className={styles.openBtn}
        onClick={() => onSelect(recipe)}
      >
        <span className={styles.name}>{recipe.name}</span>
        <span className={styles.meta}>
          {recipe.nutrition.calories} kcal/serving · {recipe.servings} servings
          {recipe.ingredients.length > 0 &&
            ` · ${recipe.ingredients.length} ingredients`}
        </span>
        {recipe.sourceSite && (
          <span className={styles.source}>{recipe.sourceSite}</span>
        )}
        <span className={styles.viewHint}>View recipe →</span>
      </button>
    </li>
  )
}

export default RecipeCard
