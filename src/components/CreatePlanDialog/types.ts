import type { CreatePlanInput } from '#/types/meal-plan'

export type CreatePlanDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (input: CreatePlanInput) => Promise<void>
}
