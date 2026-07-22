import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { KeyboardEvent } from 'react'

import { sumNutrition } from '#/lib/nutrition'
import { DND_TYPES, mealSlotDropId } from '#/lib/dnd'
import type { FoodEntry } from '#/types/meal-plan'

import type { MealDropZoneProps } from './types'
import styles from './styles.module.css'

/**
 * Droppable meal slot that accepts dragged foods and recipes.
 *
 * @param props.slot - Meal slot data
 * @param props.dayIndex - Parent day index for drop targeting
 * @param props.slotIndex - Slot index within the day
 * @param props.readOnly - Disables drag, drop, and remove interactions
 * @param props.selectedItemId - Currently selected item in use mode
 * @param props.onSelectItem - Opens item details in the use-mode sidebar
 * @param props.onRemoveItem - Handler to remove a food entry
 *
 * @example
 * <MealDropZone slot={slot} dayIndex={0} slotIndex={1} onRemoveItem={...} />
 */
const MealDropZone = ({
  slot,
  dayIndex,
  slotIndex,
  readOnly = false,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
}: MealDropZoneProps) => {
  const dropId = mealSlotDropId(dayIndex, slotIndex)
  const { isOver, setNodeRef } = useDroppable({ id: dropId, disabled: readOnly })
  const totals = sumNutrition(slot.items)

  return (
    <section
      ref={setNodeRef}
      className={clsx(styles.root, readOnly && styles.readOnly, isOver && styles.over)}
    >
      <header className={styles.header}>
        <h4 className={styles.name}>{slot.name}</h4>
        <span className={styles.total}>{Math.round(totals.calories)} kcal</span>
      </header>

      {slot.items.length === 0 ? (
        <p className={styles.empty}>
          {readOnly ? 'No items planned' : 'Drop food or recipe here'}
        </p>
      ) : (
        <ul className={styles.items}>
          {slot.items.map((item) => (
            <MealFoodItem
              key={item.id}
              item={item}
              dayIndex={dayIndex}
              slotIndex={slotIndex}
              readOnly={readOnly}
              selected={selectedItemId === item.id}
              onSelect={() => onSelectItem?.(item)}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

type MealFoodItemProps = {
  item: FoodEntry
  dayIndex: number
  slotIndex: number
  readOnly: boolean
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}

/**
 * Renders a meal item as draggable (edit mode) or selectable (use mode).
 *
 * @param props.item - Food entry in the slot
 * @param props.dayIndex - Parent day index for drag data
 * @param props.slotIndex - Parent slot index for drag data
 * @param props.readOnly - When true, item is clickable instead of draggable
 * @param props.selected - Highlights the item selected in the sidebar
 * @param props.onSelect - Opens item details in use mode
 * @param props.onRemove - Removes the item in edit mode
 */
function MealFoodItem({
  item,
  dayIndex,
  slotIndex,
  readOnly,
  selected,
  onSelect,
  onRemove,
}: MealFoodItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    disabled: readOnly,
    data: {
      type: DND_TYPES.MEAL_ITEM,
      itemId: item.id,
      dayIndex,
      slotIndex,
      name: item.name,
      calories: item.calories,
    },
  })

  return (
    <li
      ref={setNodeRef}
      className={clsx(
        styles.item,
        readOnly && styles.itemSelectable,
        selected && styles.itemSelected,
        isDragging && styles.dragging,
      )}
      {...(readOnly
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick: onSelect,
            onKeyDown: (event: KeyboardEvent<HTMLLIElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect()
              }
            },
          }
        : { ...listeners, ...attributes })}
    >
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemMacros}>
          {Math.round(item.calories)} kcal
          {item.source === 'recipe' && ' · recipe'}
        </span>
      </div>
      {!readOnly && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove ${item.name}`}
        >
          ×
        </button>
      )}
    </li>
  )
}

export default MealDropZone
