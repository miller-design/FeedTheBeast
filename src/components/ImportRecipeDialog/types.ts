import type { ImportedRecipeDraft } from '#/types/recipe'

export type ImportRecipeDialogProps = {
  open: boolean
  onClose: () => void
  onSave: (draft: ImportedRecipeDraft) => Promise<void | string>
}
