import type { MealPlan } from '#/types/meal-plan'

export type PlanEditorMode = 'use' | 'edit'

export type PlanEditorProps = {
  plan: MealPlan
  saving: boolean
  onSave: (plan: MealPlan) => Promise<void>
  /** Starting mode — `edit` for new plans, `use` when opening saved plans */
  initialMode?: PlanEditorMode
}
