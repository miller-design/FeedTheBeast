import { useState } from 'react'

import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { createId } from '#/lib/meal-plan-factory'

import type { ManualFoodDialogProps } from './types'

const FORM_ID = 'manual-food-form'

/**
 * Slide-in panel for manually entering a custom food item.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onAdd - Called with new food entry on submit
 *
 * @example
 * <ManualFoodDialog open onClose={() => {}} onAdd={(entry) => {}} />
 */
const ManualFoodDialog = ({ open, onClose, onAdd }: ManualFoodDialogProps) => {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)

  /**
   * Resets form fields and closes the panel.
   */
  function handleClose() {
    setName('')
    setCalories(0)
    setProtein(0)
    setCarbs(0)
    setFat(0)
    onClose()
  }

  /**
   * Submits the manual food form.
   */
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    onAdd({
      id: createId(),
      name: name.trim(),
      calories,
      protein,
      carbs,
      fat,
      quantity: 1,
      unit: 'serving',
      source: 'manual',
    })

    handleClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="Manual food"
      subtitle="Enter nutrition values for a custom food item."
      titleId="manual-food-title"
      footer={
        <>
          <button type="button" className={panelStyles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className={panelStyles.submitBtn}
            disabled={!name.trim()}
          >
            Add food
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className={panelStyles.form}>
        <label className={panelStyles.field}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
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
      </form>
    </SlidePanel>
  )
}

export default ManualFoodDialog
