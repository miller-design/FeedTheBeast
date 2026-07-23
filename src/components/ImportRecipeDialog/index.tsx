import { useState } from 'react'

import RecipeTagPicker from '#/components/RecipeTagPicker'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import type { RecipeTag } from '#/lib/recipe-tags'
import { importRecipeFromUrl } from '#/server/import-recipe'
import type { ImportedRecipeDraft } from '#/types/recipe'

import type { ImportRecipeDialogProps } from './types'
import styles from './styles.module.css'

const FORM_ID = 'import-recipe-form'

/**
 * Slide-in panel for importing a recipe from a food blog URL.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onSave - Called with parsed recipe draft on confirm
 *
 * @example
 * <ImportRecipeDialog open onClose={() => {}} onSave={async (draft) => {}} />
 */
const ImportRecipeDialog = ({ open, onClose, onSave }: ImportRecipeDialogProps) => {
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportedRecipeDraft | null>(null)

  /**
   * Resets panel state and closes.
   */
  function handleClose() {
    setUrl('')
    setError(null)
    setPreview(null)
    onClose()
  }

  /**
   * Fetches and parses recipe data from the URL.
   */
  async function handleImport(event: React.FormEvent) {
    event.preventDefault()
    if (!url.trim()) return

    setImporting(true)
    setError(null)
    setPreview(null)

    try {
      const result = await importRecipeFromUrl({ data: { url: url.trim() } })

      if (result.success) {
        setPreview(result.recipe)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  /**
   * Updates meal-type tags on the import preview before saving.
   *
   * @param tags - Edited controlled tags e.g. `['lunch']`
   */
  function handleTagsChange(tags: RecipeTag[]) {
    setPreview((current) => (current ? { ...current, tags } : current))
  }

  /**
   * Saves the previewed recipe and closes the panel.
   */
  async function handleConfirm() {
    if (!preview) return
    await onSave(preview)
    handleClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="Import from URL"
      subtitle="Works with Serious Eats, BBC Good Food, AllRecipes, and other sites using schema.org recipe markup."
      titleId="import-recipe-title"
      footer={
        preview ? (
          <>
            <button type="button" className={panelStyles.cancelBtn} onClick={() => setPreview(null)}>
              Back
            </button>
            <button type="button" className={panelStyles.submitBtn} onClick={() => void handleConfirm()}>
              Save to library
            </button>
          </>
        ) : (
          <>
            <button type="button" className={panelStyles.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              form={FORM_ID}
              className={panelStyles.submitBtn}
              disabled={importing || !url.trim()}
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </>
        )
      }
    >
      {!preview ? (
        <form id={FORM_ID} onSubmit={handleImport} className={panelStyles.form}>
          <label className={panelStyles.field}>
            <span>Recipe URL</span>
            <input
              id="import-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.seriouseats.com/..."
              autoFocus
            />
          </label>
          {error && <p className={panelStyles.error}>{error}</p>}
        </form>
      ) : (
        <div className={styles.preview}>
          <h3>{preview.name}</h3>
          {preview.sourceSite && (
            <p className={styles.source}>From {preview.sourceSite}</p>
          )}
          <div className={styles.meta}>
            <span>{preview.servings} servings</span>
            {preview.prepTimeMinutes != null && (
              <span>{preview.prepTimeMinutes}m prep</span>
            )}
            {preview.cookTimeMinutes != null && (
              <span>{preview.cookTimeMinutes}m cook</span>
            )}
            <span>{preview.nutrition.calories} kcal/serving</span>
          </div>

          <div className={styles.tags}>
            <RecipeTagPicker
              value={preview.tags}
              onChange={handleTagsChange}
              hint="Suggested from the recipe page — edit before saving if needed."
            />
          </div>

          <details className={styles.details}>
            <summary>{preview.ingredients.length} ingredients</summary>
            <ul>
              {preview.ingredients.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </SlidePanel>
  )
}

export default ImportRecipeDialog
