import { useEffect, useMemo, useState } from 'react'

import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { formatShoppingLine } from '#/lib/shopping-list'

import type { ShoppingListPanelProps } from './types'
import styles from './styles.module.css'

/**
 * Slide-in shopping list for a meal plan, grouped by grocery aisle.
 * Checkboxes are session-local (reset when the panel closes).
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.planName - Plan title shown in the subtitle
 * @param props.groups - Pre-built category groups from `buildShoppingList`
 *
 * @example
 * <ShoppingListPanel
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   planName={plan.name}
 *   groups={buildShoppingList(plan, recipes)}
 * />
 */
const ShoppingListPanel = ({
  open,
  onClose,
  planName,
  groups,
}: ShoppingListPanelProps) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set())

  const totalItems = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  )

  const checkedCount = checkedIds.size

  useEffect(() => {
    if (!open) {
      setCheckedIds(new Set())
    }
  }, [open])

  /**
   * Toggles whether a shopping line is marked as bought.
   *
   * @param itemId - Stable shopping-list item id
   */
  function toggleItem(itemId: string) {
    setCheckedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  /**
   * Copies the full shopping list as plain text for pasting elsewhere.
   */
  async function handleCopy() {
    const lines = groups.flatMap((group) => [
      group.label,
      ...group.items.map((item) => `- ${formatShoppingLine(item)}`),
      '',
    ])
    const text = lines.join('\n').trim()

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard may be unavailable; fail silently
    }
  }

  const subtitle =
    totalItems === 0
      ? `No ingredients found for ${planName}`
      : `${totalItems} item${totalItems !== 1 ? 's' : ''} · ${planName}`

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Shopping list"
      subtitle={subtitle}
      width="wide"
      footer={
        <>
          <button
            type="button"
            className={panelStyles.cancelBtn}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={panelStyles.submitBtn}
            onClick={() => void handleCopy()}
            disabled={totalItems === 0}
          >
            Copy list
          </button>
        </>
      }
    >
      {totalItems === 0 ? (
        <p className={styles.empty}>
          Add recipes to this plan to build a shopping list. Ingredients are
          scaled from each recipe&apos;s servings.
        </p>
      ) : (
        <div className={styles.list}>
          {checkedCount > 0 && (
            <p className={styles.progress} role="status">
              {checkedCount} of {totalItems} checked
            </p>
          )}

          {groups.map((group) => (
            <section key={group.category} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.label}</h3>
              <ul className={styles.items}>
                {group.items.map((item) => {
                  const checked = checkedIds.has(item.id)
                  const label = formatShoppingLine(item)

                  return (
                    <li key={item.id}>
                      <label
                        className={
                          checked ? `${styles.item} ${styles.checked}` : styles.item
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItem(item.id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.itemLabel}>{label}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </SlidePanel>
  )
}

export default ShoppingListPanel
