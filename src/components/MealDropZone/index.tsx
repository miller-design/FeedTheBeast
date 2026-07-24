import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

import { sumNutrition } from '#/lib/nutrition'
import { DND_TYPES, mealSlotDropId } from '#/lib/dnd'
import type { FoodEntry } from '#/types/meal-plan'

import type { MealDropZoneProps } from './types'
import styles from './styles.module.css'

/**
 * Droppable meal slot that accepts dragged foods and recipes,
 * plus tap-to-place on touch devices.
 *
 * @param props.slot - Meal slot data
 * @param props.dayIndex - Parent day index for drop targeting
 * @param props.slotIndex - Slot index within the day
 * @param props.readOnly - Disables drag, drop, and remove interactions
 * @param props.selectedItemId - Currently selected item in use mode
 * @param props.onSelectItem - Opens item details in the use-mode sidebar
 * @param props.onRemoveItem - Handler to remove a food entry
 * @param props.placementActive - Highlights the zone for tap-to-place
 * @param props.onPlaceHere - Completes tap-to-place into this slot
 * @param props.onRequestMove - Starts move-via-tap for an existing item
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
  placementActive = false,
  onPlaceHere,
  onRequestMove,
}: MealDropZoneProps) => {
  const dropId = mealSlotDropId(dayIndex, slotIndex)
  const { isOver, setNodeRef } = useDroppable({ id: dropId, disabled: readOnly })
  const totals = sumNutrition(slot.items)

  /**
   * Completes tap-to-place when the zone (not an item) is activated.
   */
  function handleZoneActivate() {
    if (!placementActive || readOnly) return
    onPlaceHere?.()
  }

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        styles.root,
        readOnly && styles.readOnly,
        isOver && styles.over,
        placementActive && styles.placementTarget,
      )}
      data-keep-selection={placementActive ? '' : undefined}
      onClick={placementActive ? handleZoneActivate : undefined}
      onKeyDown={
        placementActive
          ? (event: KeyboardEvent<HTMLElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleZoneActivate()
              }
            }
          : undefined
      }
      role={placementActive ? 'button' : undefined}
      tabIndex={placementActive ? 0 : undefined}
      aria-label={
        placementActive ? `Add to ${slot.name}` : undefined
      }
    >
      <header className={styles.header}>
        <h4 className={styles.name}>{slot.name}</h4>
        <span className={styles.total}>{Math.round(totals.calories)} kcal</span>
      </header>

      {slot.items.length === 0 ? (
        <p className={styles.empty}>
          {readOnly
            ? 'No items planned'
            : placementActive
              ? 'Tap to add here'
              : 'Drop food or recipe here'}
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
              placementActive={placementActive}
              onSelect={() => onSelectItem?.(item)}
              onRemove={() => onRemoveItem(item.id)}
              onRequestMove={() => onRequestMove?.(item)}
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
  placementActive: boolean
  onSelect: () => void
  onRemove: () => void
  onRequestMove: () => void
}

/**
 * Renders a meal item as draggable (edit mode) or selectable (use mode).
 * In edit mode, a quick tap starts move-via-placement; long-press still drags.
 *
 * @param props.item - Food entry in the slot
 * @param props.dayIndex - Parent day index for drag data
 * @param props.slotIndex - Parent slot index for drag data
 * @param props.readOnly - When true, item is clickable instead of draggable
 * @param props.selected - Highlights the item selected in the sidebar
 * @param props.placementActive - Suppresses item taps while placing another item
 * @param props.onSelect - Opens item details in use mode
 * @param props.onRemove - Removes the item in edit mode
 * @param props.onRequestMove - Starts tap-to-move placement for this item
 */
function MealFoodItem({
  item,
  dayIndex,
  slotIndex,
  readOnly,
  selected,
  placementActive,
  onSelect,
  onRemove,
  onRequestMove,
}: MealFoodItemProps) {
  const didDragRef = useRef(false)
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

  useEffect(() => {
    if (isDragging) didDragRef.current = true
  }, [isDragging])

  if (readOnly) {
    return (
      <li
        ref={setNodeRef}
        className={clsx(
          styles.item,
          styles.itemSelectable,
          selected && styles.itemSelected,
        )}
        data-keep-selection={selected ? '' : undefined}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
      >
        <div className={styles.itemInfo}>
          <span className={styles.itemName}>{item.name}</span>
          <span className={styles.itemMacros}>
            {Math.round(item.calories)} kcal
            {item.source === 'recipe' && ' · recipe'}
          </span>
        </div>
      </li>
    )
  }

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.item, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        if (placementActive || isDragging) return
        if (didDragRef.current) {
          didDragRef.current = false
          return
        }
        event.stopPropagation()
        onRequestMove()
      }}
    >
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemMacros}>
          {Math.round(item.calories)} kcal
          {item.source === 'recipe' && ' · recipe'}
        </span>
      </div>
      <button
        type="button"
        className={styles.removeBtn}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove ${item.name}`}
      >
        ×
      </button>
    </li>
  )
}

export default MealDropZone
