import { useState } from 'react'

import RecipeTagPicker from '#/components/RecipeTagPicker'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import type { RecipeTag } from '#/lib/recipe-tags'
import type { CreateRecipeInput } from '#/types/recipe'

import type { NewRecipeDialogProps } from './types'

const FORM_ID = 'new-recipe-form'

/**
 * Slide-in panel for manually creating a new recipe.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onSave - Called with form values on submit
 *
 * @example
 * <NewRecipeDialog open onClose={() => {}} onSave={async (input) => {}} />
 */
const NewRecipeDialog = ({ open, onClose, onSave }: NewRecipeDialogProps) => {
  const [name, setName] = useState('')
  const [servings, setServings] = useState(4)
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)
  const [ingredientsText, setIngredientsText] = useState('')
  const [instructionsText, setInstructionsText] = useState('')
  const [tags, setTags] = useState<RecipeTag[]>([])
  const [submitting, setSubmitting] = useState(false)

  /**
   * Parses newline-separated text into a string array.
   *
   * @param text - Raw textarea content
   * @returns Trimmed non-empty lines
   */
  function parseLines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  /**
   * Resets form and closes the panel.
   */
  function handleClose() {
    setName('')
    setServings(4)
    setCalories(0)
    setProtein(0)
    setCarbs(0)
    setFat(0)
    setIngredientsText('')
    setInstructionsText('')
    setTags([])
    onClose()
  }

  /**
   * Submits the new recipe form.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)

    const input: CreateRecipeInput = {
      name: name.trim(),
      servings,
      ingredients: parseLines(ingredientsText),
      instructions: parseLines(instructionsText),
      nutrition: { calories, protein, carbs, fat },
      tags,
    }

    await onSave(input)
    setSubmitting(false)
    handleClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="New recipe"
      subtitle="Build a recipe from scratch. Add nutrition per serving so it can be dropped into meal plans."
      titleId="new-recipe-title"
      footer={
        <>
          <button type="button" className={panelStyles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className={panelStyles.submitBtn}
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Saving…' : 'Save recipe'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className={panelStyles.form}>
        <label className={panelStyles.field}>
          <span>Recipe name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mac and cheese"
            required
            autoFocus
          />
        </label>

        <label className={panelStyles.field}>
          <span>Servings</span>
          <input
            type="number"
            min={1}
            max={99}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
          />
        </label>

        <RecipeTagPicker
          value={tags}
          onChange={setTags}
          hint="Optional — used to filter recipes when building meal plans."
        />

        <fieldset className={panelStyles.fieldset}>
          <legend>Nutrition per serving</legend>
          <div className={panelStyles.macroGrid}>
            <label className={panelStyles.field}>
              <span>Calories</span>
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Protein (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Carbs (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Fat (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
              />
            </label>
          </div>
        </fieldset>

        <label className={panelStyles.field}>
          <span>Ingredients (one per line)</span>
          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            rows={5}
            placeholder={'200g macaroni\n50g butter\n50g flour\n500ml milk'}
          />
        </label>

        <label className={panelStyles.field}>
          <span>Instructions (one step per line)</span>
          <textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            rows={5}
            placeholder={
              'Boil the pasta until al dente.\nMake the cheese sauce.\nCombine and bake.'
            }
          />
        </label>
      </form>
    </SlidePanel>
  )
}

export default NewRecipeDialog
