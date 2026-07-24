import { useEffect, useState } from 'react'

import RecipeTagPicker from '#/components/RecipeTagPicker'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import type { RecipeTag } from '#/lib/recipe-tags'
import type { UpdateRecipeInput } from '#/types/recipe'

import type { RecipeDetailPanelProps } from './types'
import styles from './styles.module.css'

const EDIT_FORM_ID = 'recipe-detail-edit-form'

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
 * Parses newline-separated text into a string array.
 *
 * @param text - Raw textarea content e.g. `"1 tbsp oil\n500g beef mince"`
 * @returns Trimmed non-empty lines
 */
function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Slide-in panel showing full recipe details with optional edit mode.
 *
 * @param props.recipe - Recipe to display, or null when closed
 * @param props.onClose - Close handler
 * @param props.onDelete - Called when the user confirms deletion
 * @param props.onUpdateTags - Persists meal-type tag edits
 * @param props.onUpdateRecipe - Persists nutrition, ingredients, and method edits
 *
 * @example
 * <RecipeDetailPanel recipe={selected} onClose={() => {}} onDelete={removeRecipe} onUpdateTags={setRecipeTags} onUpdateRecipe={editRecipe} />
 */
const RecipeDetailPanel = ({
  recipe,
  onClose,
  onDelete,
  onUpdateTags,
  onUpdateRecipe,
}: RecipeDetailPanelProps) => {
  const open = recipe != null
  const [savingTags, setSavingTags] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [servings, setServings] = useState(1)
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)
  const [ingredientsText, setIngredientsText] = useState('')
  const [instructionsText, setInstructionsText] = useState('')

  useEffect(() => {
    setEditing(false)
  }, [recipe?.id])

  /**
   * Loads the current recipe into the edit form.
   *
   * @param current - Recipe being edited
   */
  function loadDraft(current: NonNullable<RecipeDetailPanelProps['recipe']>) {
    setName(current.name)
    setServings(current.servings)
    setCalories(current.nutrition.calories)
    setProtein(current.nutrition.protein)
    setCarbs(current.nutrition.carbs)
    setFat(current.nutrition.fat)
    setIngredientsText(current.ingredients.map((ingredient) => ingredient.text).join('\n'))
    setInstructionsText(current.instructions.join('\n'))
  }

  /**
   * Enters edit mode with the open recipe's current values.
   */
  function handleStartEdit() {
    if (!recipe) return
    loadDraft(recipe)
    setEditing(true)
  }

  /**
   * Discards unsaved edits and returns to view mode.
   */
  function handleCancelEdit() {
    setEditing(false)
  }

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

  /**
   * Persists edited recipe fields and exits edit mode.
   */
  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!recipe || !name.trim()) return

    setSaving(true)

    const input: UpdateRecipeInput = {
      name: name.trim(),
      servings,
      ingredients: parseLines(ingredientsText),
      instructions: parseLines(instructionsText),
      nutrition: { calories, protein, carbs, fat },
    }

    try {
      await onUpdateRecipe(recipe.id, input)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const panelTitle = editing ? 'Edit recipe' : (recipe?.name ?? '')
  const panelSubtitle = editing
    ? 'Adjust nutrition, ingredients, or cooking steps.'
    : buildSubtitle(recipe)

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={panelTitle}
      subtitle={panelSubtitle}
      titleId="recipe-detail-title"
      width="wide"
      footer={
        editing ? (
          <>
            <button type="button" className={panelStyles.cancelBtn} onClick={handleCancelEdit}>
              Cancel
            </button>
            <button
              type="submit"
              form={EDIT_FORM_ID}
              className={panelStyles.submitBtn}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        ) : (
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
            <button type="button" className={panelStyles.tertiaryBtn} onClick={handleStartEdit}>
              Edit
            </button>
            <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          </div>
        )
      }
    >
      {recipe && editing ? (
        <form id={EDIT_FORM_ID} onSubmit={handleSaveEdit} className={panelStyles.form}>
          <label className={panelStyles.field}>
            <span>Recipe name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className={panelStyles.field}>
            <span>Servings</span>
            <input
              type="number"
              min={1}
              max={99}
              value={servings}
              onChange={(event) => setServings(Number(event.target.value))}
            />
          </label>

          <fieldset className={panelStyles.fieldset}>
            <legend>Nutrition per serving</legend>
            <div className={panelStyles.macroGrid}>
              <label className={panelStyles.field}>
                <span>Calories</span>
                <input
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(event) => setCalories(Number(event.target.value))}
                />
              </label>
              <label className={panelStyles.field}>
                <span>Protein (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={protein}
                  onChange={(event) => setProtein(Number(event.target.value))}
                />
              </label>
              <label className={panelStyles.field}>
                <span>Carbs (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={carbs}
                  onChange={(event) => setCarbs(Number(event.target.value))}
                />
              </label>
              <label className={panelStyles.field}>
                <span>Fat (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={fat}
                  onChange={(event) => setFat(Number(event.target.value))}
                />
              </label>
            </div>
          </fieldset>

          <label className={panelStyles.field}>
            <span>Ingredients (one per line)</span>
            <textarea
              value={ingredientsText}
              onChange={(event) => setIngredientsText(event.target.value)}
              rows={8}
            />
          </label>

          <label className={panelStyles.field}>
            <span>Instructions (one step per line)</span>
            <textarea
              value={instructionsText}
              onChange={(event) => setInstructionsText(event.target.value)}
              rows={8}
            />
          </label>
        </form>
      ) : (
        recipe && (
          <div className={styles.content}>
            {recipe.imageUrl && (
              <figure className={styles.hero}>
                <img
                  src={recipe.imageUrl}
                  alt=""
                  className={styles.heroImage}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            )}

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
        )
      )}
    </SlidePanel>
  )
}

export default RecipeDetailPanel
