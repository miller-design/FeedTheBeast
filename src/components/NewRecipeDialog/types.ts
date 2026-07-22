import type { CreateRecipeInput } from '#/types/recipe'

export type NewRecipeDialogProps = {
  open: boolean
  onClose: () => void
  onSave: (input: CreateRecipeInput) => Promise<void | string>
}
