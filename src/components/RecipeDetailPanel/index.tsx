import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'

import type { RecipeDetailPanelProps } from './types'
import styles from './styles.module.css'

/**
 * Builds a subtitle string from recipe metadata.
 *
 * @param recipe - Recipe to summarise
 * @returns Comma-separated meta line e.g. `"311 kcal/serving · 4 servings"`
 */
function buildSubtitle(recipe: RecipeDetailPanelProps['recipe']): string | undefined {
  if (!recipe) return undefined

  const parts = [
    `${recipe.nutrition.calories} kcal/serving`,
    `${recipe.servings} serving${recipe.servings !== 1 ? 's' : ''}`,
  ]

  if (recipe.prepTimeMinutes != null) {
    parts.push(`${recipe.prepTimeMinutes}m prep`)
  }

  if (recipe.cookTimeMinutes != null) {
    parts.push(`${recipe.cookTimeMinutes}m cook`)
  }

  if (recipe.sourceSite) {
    parts.push(recipe.sourceSite)
  }

  return parts.join(' · ')
}

/**
 * Slide-in panel showing full recipe details: ingredients and cooking method.
 *
 * @param props.recipe - Recipe to display, or null when closed
 * @param props.onClose - Close handler
 * @param props.onDelete - Called when the user confirms deletion
 *
 * @example
 * <RecipeDetailPanel recipe={selected} onClose={() => {}} onDelete={removeRecipe} />
 */
const RecipeDetailPanel = ({ recipe, onClose, onDelete }: RecipeDetailPanelProps) => {
  const open = recipe != null

  /**
   * Deletes the current recipe and closes the panel.
   */
  function handleDelete() {
    if (!recipe) return
    if (confirm(`Delete "${recipe.name}"?`)) {
      void onDelete(recipe.id)
      onClose()
    }
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={recipe?.name ?? ''}
      subtitle={buildSubtitle(recipe)}
      titleId="recipe-detail-title"
      width="wide"
      footer={
        <div className={styles.footerBar}>
          {recipe?.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={panelStyles.tertiaryBtn}
            >
              View original
            </a>
          )}
          <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
            Delete
          </button>
        </div>
      }
    >
      {recipe && (
        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Nutrition per serving</h3>
            <dl className={styles.nutritionGrid}>
              <div>
                <dt>Calories</dt>
                <dd>{recipe.nutrition.calories} kcal</dd>
              </div>
              <div>
                <dt>Protein</dt>
                <dd>{recipe.nutrition.protein}g</dd>
              </div>
              <div>
                <dt>Carbs</dt>
                <dd>{recipe.nutrition.carbs}g</dd>
              </div>
              <div>
                <dt>Fat</dt>
                <dd>{recipe.nutrition.fat}g</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Ingredients
              {recipe.ingredients.length > 0 && (
                <span className={styles.count}>{recipe.ingredients.length}</span>
              )}
            </h3>
            {recipe.ingredients.length > 0 ? (
              <ul className={styles.ingredientList}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>{ingredient.text}</li>
                ))}
              </ul>
            ) : (
              <p className={panelStyles.hint}>No ingredients saved for this recipe.</p>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Method
              {recipe.instructions.length > 0 && (
                <span className={styles.count}>{recipe.instructions.length} steps</span>
              )}
            </h3>
            {recipe.instructions.length > 0 ? (
              <ol className={styles.methodList}>
                {recipe.instructions.map((step, index) => (
                  <li key={`${recipe.id}-step-${index}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className={panelStyles.hint}>No cooking method saved for this recipe.</p>
            )}
          </section>
        </div>
      )}
    </SlidePanel>
  )
}

export default RecipeDetailPanel
