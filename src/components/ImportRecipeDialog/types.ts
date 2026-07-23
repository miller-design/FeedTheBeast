import type { ImportedRecipeDraft } from '#/types/recipe'

export type ImportRecipeDialogProps = {
  open: boolean
  onClose: () => void
  onSave: (draft: ImportedRecipeDraft) => Promise<void | string>
  /** Returns an existing library recipe for the same source URL, if any */
  onCheckDuplicate?: (sourceUrl: string) => Promise<{ id: string; name: string } | undefined>
  /** Opens an existing recipe when import is blocked as a duplicate */
  onOpenExisting?: (recipeId: string) => void
}
