import { useCallback, useState } from 'react'

/**
 * Shared multi-select state for card grids (plans, recipes).
 * Tracks select mode and a set of selected item IDs.
 *
 * @returns Selecting flag, selected IDs, and helpers to enter/exit/toggle/select-all
 *
 * @example
 * const { selecting, selectedIds, enterSelect, exitSelect, toggle, selectAll, isSelected } =
 *   useMultiSelect()
 */
export function useMultiSelect() {
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  /**
   * Enters select mode without clearing any prior selection.
   */
  const enterSelect = useCallback(() => {
    setSelecting(true)
  }, [])

  /**
   * Leaves select mode and clears the selection.
   */
  const exitSelect = useCallback(() => {
    setSelecting(false)
    setSelectedIds(new Set())
  }, [])

  /**
   * Toggles whether one item is selected.
   *
   * @param id - Item UUID to add or remove from the selection
   *
   * @example
   * toggle(plan.id)
   */
  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  /**
   * Replaces the selection with every provided ID (select all).
   *
   * @param ids - Full list of selectable item UUIDs
   *
   * @example
   * selectAll(plans.map((plan) => plan.id))
   */
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  /**
   * Clears selected IDs while staying in select mode.
   */
  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  /**
   * Returns whether an item is currently selected.
   *
   * @param id - Item UUID to check
   * @returns True when the ID is in the selection set
   *
   * @example
   * isSelected(recipe.id)
   */
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  )

  return {
    selecting,
    selectedIds,
    selectedCount: selectedIds.size,
    enterSelect,
    exitSelect,
    toggle,
    selectAll,
    clear,
    isSelected,
  }
}
