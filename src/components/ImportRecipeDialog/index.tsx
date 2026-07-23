import { useState } from 'react'

import RecipeTagPicker from '#/components/RecipeTagPicker'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { parseRecipeFromJsonLdPaste } from '#/lib/recipe-import'
import type { RecipeTag } from '#/lib/recipe-tags'
import { importRecipeFromUrl } from '#/server/import-recipe'
import type { ImportedRecipeDraft } from '#/types/recipe'

import type { ImportRecipeDialogProps } from './types'
import styles from './styles.module.css'

const FORM_ID = 'import-recipe-form'

type ImportMode = 'url' | 'json'

/**
 * Slide-in panel for importing a recipe from a food blog URL or pasted JSON-LD.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onSave - Called with parsed recipe draft on confirm
 * @param props.onCheckDuplicate - Optional lookup for an existing recipe with the same source URL
 * @param props.onOpenExisting - Opens an existing recipe when import is blocked as a duplicate
 *
 * @example
 * <ImportRecipeDialog open onClose={() => {}} onSave={async (draft) => {}} />
 */
const ImportRecipeDialog = ({
  open,
  onClose,
  onSave,
  onCheckDuplicate,
  onOpenExisting,
}: ImportRecipeDialogProps) => {
  const [mode, setMode] = useState<ImportMode>('url')
  const [url, setUrl] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportedRecipeDraft | null>(null)
  const [duplicateRecipe, setDuplicateRecipe] = useState<{ id: string; name: string } | null>(
    null,
  )

  /**
   * Resets panel state and closes.
   */
  function handleClose() {
    setMode('url')
    setUrl('')
    setJsonText('')
    setError(null)
    setPreview(null)
    setDuplicateRecipe(null)
    onClose()
  }

  /**
   * Switches between URL fetch and JSON paste modes.
   *
   * @param next - Mode to activate e.g. `"json"`
   */
  function handleModeChange(next: ImportMode) {
    setMode(next)
    setError(null)
    setPreview(null)
    setDuplicateRecipe(null)
  }

  /**
   * Runs duplicate detection for a parsed draft when a source URL is present.
   *
   * @param draft - Parsed import preview
   */
  async function checkDuplicate(draft: ImportedRecipeDraft) {
    if (!draft.sourceUrl || !onCheckDuplicate) return
    const existing = await onCheckDuplicate(draft.sourceUrl)
    if (existing) {
      setDuplicateRecipe(existing)
    }
  }

  /**
   * Fetches and parses recipe data from the URL, or parses pasted JSON-LD.
   */
  async function handleImport(event: React.FormEvent) {
    event.preventDefault()

    setImporting(true)
    setError(null)
    setPreview(null)
    setDuplicateRecipe(null)

    try {
      if (mode === 'url') {
        if (!url.trim()) return

        const result = await importRecipeFromUrl({ data: { url: url.trim() } })

        if (result.success) {
          setPreview(result.recipe)
          await checkDuplicate(result.recipe)
        } else {
          setError(result.error)
        }
        return
      }

      if (!jsonText.trim()) return

      const draft = parseRecipeFromJsonLdPaste(jsonText, url.trim() || undefined)
      if (!draft) {
        setError(
          'No Recipe data found in that paste. Copy the application/ld+json block that includes "@type": "Recipe".',
        )
        return
      }

      setPreview(draft)
      await checkDuplicate(draft)
    } catch {
      setError(mode === 'url' ? 'Import failed. Please try again.' : 'Could not parse that JSON.')
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
    if (!preview || duplicateRecipe) return

    try {
      await onSave(preview)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recipe.')
    }
  }

  const canSubmit =
    mode === 'url' ? Boolean(url.trim()) : Boolean(jsonText.trim())

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="Import recipe"
      subtitle="Fetch from a URL, or paste schema.org JSON-LD from View Source when a site blocks automated imports."
      titleId="import-recipe-title"
      footer={
        preview ? (
          <>
            <button
              type="button"
              className={panelStyles.cancelBtn}
              onClick={() => {
                setPreview(null)
                setDuplicateRecipe(null)
                setError(null)
              }}
            >
              Back
            </button>
            <button
              type="button"
              className={panelStyles.submitBtn}
              onClick={() => void handleConfirm()}
              disabled={Boolean(duplicateRecipe)}
            >
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
              disabled={importing || !canSubmit}
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </>
        )
      }
    >
      {!preview ? (
        <form id={FORM_ID} onSubmit={handleImport} className={panelStyles.form}>
          <div className={styles.modeSwitch} role="tablist" aria-label="Import method">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'url'}
              className={mode === 'url' ? styles.modeActive : styles.modeBtn}
              onClick={() => handleModeChange('url')}
            >
              From URL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'json'}
              className={mode === 'json' ? styles.modeActive : styles.modeBtn}
              onClick={() => handleModeChange('json')}
            >
              Paste JSON-LD
            </button>
          </div>

          {mode === 'url' ? (
            <>
              <label className={panelStyles.field}>
                <span>Recipe URL</span>
                <input
                  id="import-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.bbcgoodfood.com/recipes/..."
                  autoFocus
                />
              </label>
              <p className={panelStyles.hint}>
                Works with Pinch of Yum, BBC Good Food, RecipeTin Eats, King Arthur, Cookie and Kate,
                Simply Recipes, and similar sites. Serious Eats and AllRecipes often block fetches —
                use Paste JSON-LD for those.
              </p>
            </>
          ) : (
            <>
              <label className={panelStyles.field}>
                <span>JSON-LD</span>
                <textarea
                  id="import-json"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={'{"@type":"Recipe","name":"...", ...}'}
                  rows={10}
                  autoFocus
                  spellCheck={false}
                />
              </label>
              <label className={panelStyles.field}>
                <span>Source URL (optional)</span>
                <input
                  id="import-json-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.seriouseats.com/..."
                />
              </label>
              <p className={panelStyles.hint}>
                In the recipe page, View Source and search for <code>ld+json</code> or{' '}
                <code>&quot;@type&quot;: &quot;Recipe&quot;</code>. Paste the JSON object (or the whole
                script tag). Add the page URL so we can credit the source and catch duplicates.
              </p>
            </>
          )}

          {error && <p className={panelStyles.error}>{error}</p>}
        </form>
      ) : (
        <div className={styles.preview}>
          <h3>{preview.name}</h3>
          {preview.sourceSite && (
            <p className={styles.source}>From {preview.sourceSite}</p>
          )}
          {duplicateRecipe && (
            <p className={panelStyles.error}>
              Already in your library as &ldquo;{duplicateRecipe.name}&rdquo;.
              {onOpenExisting && (
                <>
                  {' '}
                  <button
                    type="button"
                    className={styles.existingLink}
                    onClick={() => {
                      onOpenExisting(duplicateRecipe.id)
                      handleClose()
                    }}
                  >
                    View existing recipe
                  </button>
                </>
              )}
            </p>
          )}
          {error && <p className={panelStyles.error}>{error}</p>}
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
