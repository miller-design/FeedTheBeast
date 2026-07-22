import { useState } from 'react'

import FoodSearchModal from '#/components/FoodSearchModal'
import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { cloneFoodEntries } from '#/lib/meal-plan-factory'
import { sumNutrition } from '#/lib/nutrition'
import type { FoodEntry, SavedMeal } from '#/types/meal-plan'

import type { MealSlotCardProps } from './types'
import styles from './styles.module.css'

/**
 * Displays a single meal slot (e.g. Breakfast) with its food items.
 *
 * @param props.slot - Meal slot data
 * @param props.savedMeals - Reusable meal templates available to load
 * @param props.onAddItem - Called when user adds a food entry
 * @param props.onRemoveItem - Called when user removes a food entry
 * @param props.onSaveAsTemplate - Optional handler to save slot as reusable meal
 *
 * @example
 * <MealSlotCard slot={breakfastSlot} savedMeals={[]} onAddItem={...} onRemoveItem={...} />
 */
const MealSlotCard = ({
  slot,
  savedMeals,
  onAddItem,
  onRemoveItem,
  onSaveAsTemplate,
  foodModalOpen,
  onOpenFoodModal,
  onCloseFoodModal,
}: MealSlotCardProps) => {
  const [loadPanelOpen, setLoadPanelOpen] = useState(false)
  const totals = sumNutrition(slot.items)

  /**
   * Loads a saved meal template into this slot by cloning its items.
   *
   * @param meal - Saved meal template to load
   */
  function handleLoadSavedMeal(meal: SavedMeal) {
    const cloned = cloneFoodEntries(meal.items)
    cloned.forEach((entry) => onAddItem(entry))
    setLoadPanelOpen(false)
  }

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <h4 className={styles.name}>{slot.name}</h4>
        <span className={styles.total}>{Math.round(totals.calories)} kcal</span>
      </header>

      {slot.items.length > 0 && (
        <ul className={styles.items}>
          {slot.items.map((item) => (
            <FoodItemRow
              key={item.id}
              item={item}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.addBtn} onClick={onOpenFoodModal}>
          + Add food
        </button>
        {savedMeals.length > 0 && (
          <button
            type="button"
            className={styles.loadBtn}
            onClick={() => setLoadPanelOpen(true)}
          >
            Load meal
          </button>
        )}
        {slot.items.length > 0 && onSaveAsTemplate && (
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => onSaveAsTemplate(slot)}
          >
            Save meal
          </button>
        )}
      </div>

      <FoodSearchModal
        open={foodModalOpen}
        onClose={onCloseFoodModal}
        onAdd={onAddItem}
      />

      <SlidePanel
        open={loadPanelOpen}
        onClose={() => setLoadPanelOpen(false)}
        title="Load saved meal"
        subtitle="Choose a saved meal template to add to this slot."
        titleId="load-saved-meal-title"
        footer={
          <button
            type="button"
            className={panelStyles.cancelBtn}
            onClick={() => setLoadPanelOpen(false)}
          >
            Cancel
          </button>
        }
      >
        <ul className={styles.loadList}>
          {savedMeals.map((meal) => (
            <li key={meal.id}>
              <button
                type="button"
                className={styles.loadItemBtn}
                onClick={() => handleLoadSavedMeal(meal)}
              >
                <span>{meal.name}</span>
                <span className={styles.loadMeta}>
                  {Math.round(meal.items.reduce((s, i) => s + i.calories, 0))} kcal
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SlidePanel>
    </section>
  )
}

type FoodItemRowProps = {
  item: FoodEntry
  onRemove: () => void
}

/** Single food item row within a meal slot */
function FoodItemRow({ item, onRemove }: FoodItemRowProps) {
  return (
    <li className={styles.item}>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemMacros}>
          {Math.round(item.calories)} kcal · P {item.protein}g · C {item.carbs}g · F{' '}
          {item.fat}g
        </span>
      </div>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
      >
        ×
      </button>
    </li>
  )
}

export default MealSlotCard
