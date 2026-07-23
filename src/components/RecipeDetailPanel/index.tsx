import { useState } from 'react'

import RecipeTagPicker from '#/components/RecipeTagPicker'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import type { RecipeTag } from '#/lib/recipe-tags'

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
 * Returns tags for a recipe, defaulting to [] for legacy records.
 *
 * @param recipe - Recipe that may predate the tags field
 * @returns Controlled tags
 */
function recipeTags(recipe: NonNullable<RecipeDetailPanelProps['recipe']>): RecipeTag[] {
  return Array.isArray(recipe.tags) ? recipe.tags : []
}

/**
 * Slide-in panel showing full recipe details: ingredients and cooking method.
 *
 * @param props.recipe - Recipe to display, or null when closed
 * @param props.onClose - Close handler
 * @param props.onDelete - Called when the user confirms deletion
 * @param props.onUpdateTags - Persists meal-type tag edits
 *
 * @example
 * <RecipeDetailPanel recipe={selected} onClose={() => {}} onDelete={removeRecipe} onUpdateTags={setRecipeTags} />
 */
const RecipeDetailPanel = ({
  recipe,
  onClose,
  onDelete,
  onUpdateTags,
}: RecipeDetailPanelProps) => {
  const open = recipe != null
  const [savingTags, setSavingTags] = useState(false)

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

  /**
   * Saves meal-type tag changes for the open recipe.
   *
   * @param tags - Updated controlled tags e.g. `['dinner', 'snack']`
   */
  async function handleTagsChange(tags: RecipeTag[]) {
    if (!recipe) return
    setSavingTags(true)
    try {
      await onUpdateTags(recipe.id, tags)
    } finally {
      setSavingTags(false)
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
            <RecipeTagPicker
              value={recipeTags(recipe)}
              onChange={(tags) => void handleTagsChange(tags)}
              disabled={savingTags}
              hint="Optional — tag existing recipes here so they show up in plan filters."
            />
          </section>

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
