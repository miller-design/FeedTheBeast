import { useState } from 'react'
import clsx from 'clsx'

import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { todayIsoDate } from '#/lib/dates'
import type { PlanDurationPreset } from '#/types/meal-plan'

import type { CreatePlanDialogProps } from './types'
import styles from './styles.module.css'

const FORM_ID = 'create-plan-form'

const DURATION_OPTIONS: { value: PlanDurationPreset; label: string; days: number }[] = [
  { value: '1', label: '1 day', days: 1 },
  { value: '2', label: '2 days', days: 2 },
  { value: '7', label: '1 week', days: 7 },
  { value: '14', label: '2 weeks', days: 14 },
  { value: '30', label: '1 month', days: 30 },
  { value: 'custom', label: 'Custom', days: 0 },
]

/**
 * Slide-in panel for creating a new meal plan.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onCreate - Called with plan form values on submit
 *
 * @example
 * <CreatePlanDialog open onClose={() => {}} onCreate={async (input) => {}} />
 */
const CreatePlanDialog = ({ open, onClose, onCreate }: CreatePlanDialogProps) => {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayIsoDate())
  const [duration, setDuration] = useState<PlanDurationPreset>('7')
  const [customDays, setCustomDays] = useState(10)
  const [calorieTarget, setCalorieTarget] = useState(2000)
  const [submitting, setSubmitting] = useState(false)

  const selectedOption = DURATION_OPTIONS.find((o) => o.value === duration)
  const durationDays =
    duration === 'custom' ? customDays : (selectedOption?.days ?? 7)

  /**
   * Handles form submission and plan creation.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || durationDays < 1) return

    setSubmitting(true)
    await onCreate({
      name: name.trim(),
      startDate,
      durationDays,
      defaultCalorieTarget: calorieTarget,
    })
    setSubmitting(false)
    setName('')
    onClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="New meal plan"
      subtitle="Choose a duration and daily calorie target. You can adjust targets per day later."
      titleId="create-plan-title"
      footer={
        <>
          <button type="button" className={panelStyles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className={panelStyles.submitBtn}
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Creating…' : 'Create plan'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className={panelStyles.form}>
        <label className={panelStyles.field}>
          <span>Plan name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer cut week 1"
            required
            autoFocus
          />
        </label>

        <label className={panelStyles.field}>
          <span>Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>

        <fieldset className={panelStyles.fieldset}>
          <legend>Duration</legend>
          <div className={styles.durationGrid}>
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={clsx(
                  styles.durationBtn,
                  duration === option.value && styles.durationActive,
                )}
                onClick={() => setDuration(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {duration === 'custom' && (
          <label className={panelStyles.field}>
            <span>Number of days</span>
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              onChange={(e) => setCustomDays(Number(e.target.value))}
            />
          </label>
        )}

        <label className={panelStyles.field}>
          <span>Daily calorie target (kcal)</span>
          <input
            type="number"
            min={500}
            max={10000}
            step={50}
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
          />
        </label>

        <p className={panelStyles.hint}>
          You can adjust the calorie target for each day individually after creating
          the plan.
        </p>
      </form>
    </SlidePanel>
  )
}

export default CreatePlanDialog
