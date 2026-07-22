import { useState } from 'react'

import CalorieBar from '#/components/CalorieBar'
import MealSlotCard from '#/components/MealSlotCard'
import { formatPlanDate } from '#/lib/dates'
import { sumNutrition } from '#/lib/nutrition'
import type { FoodEntry, MealSlot } from '#/types/meal-plan'

import type { DayPanelProps } from './types'
import styles from './styles.module.css'

/**
 * Displays one day column in the meal plan grid with editable calorie target.
 *
 * @param props.day - Plan day data
 * @param props.dayIndex - Index in the plan's days array
 * @param props.onUpdateDay - Called when day data changes
 * @param props.onSaveMealTemplate - Optional handler to save a meal slot
 *
 * @example
 * <DayPanel day={planDay} dayIndex={0} onUpdateDay={updateDay} />
 */
const DayPanel = ({
  day,
  dayIndex,
  savedMeals,
  onUpdateDay,
  onSaveMealTemplate,
}: DayPanelProps) => {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  const allItems = day.meals.flatMap((meal) => meal.items)
  const dayTotals = sumNutrition(allItems)

  /**
   * Updates the calorie target for this day.
   *
   * @param target - New daily calorie goal
   */
  function handleCalorieTargetChange(target: number) {
    onUpdateDay(dayIndex, { ...day, calorieTarget: target })
  }

  /**
   * Updates a specific meal slot within this day.
   *
   * @param slotIndex - Index of the meal slot
   * @param updatedSlot - Modified meal slot
   */
  function updateMealSlot(slotIndex: number, updatedSlot: MealSlot) {
    const meals = [...day.meals]
    meals[slotIndex] = updatedSlot
    onUpdateDay(dayIndex, { ...day, meals })
  }

  /**
   * Adds a food entry to a meal slot.
   *
   * @param slotIndex - Index of the target meal slot
   * @param entry - Food entry to add
   */
  function handleAddItem(slotIndex: number, entry: FoodEntry) {
    const slot = day.meals[slotIndex]
    updateMealSlot(slotIndex, {
      ...slot,
      items: [...slot.items, entry],
    })
    setActiveSlotId(null)
  }

  /**
   * Removes a food entry from a meal slot.
   *
   * @param slotIndex - Index of the meal slot
   * @param itemId - ID of the food entry to remove
   */
  function handleRemoveItem(slotIndex: number, itemId: string) {
    const slot = day.meals[slotIndex]
    updateMealSlot(slotIndex, {
      ...slot,
      items: slot.items.filter((item) => item.id !== itemId),
    })
  }

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <h3 className={styles.date}>{formatPlanDate(day.date)}</h3>
        <label className={styles.targetField}>
          <span className={styles.targetLabel}>Target</span>
          <input
            type="number"
            min={500}
            max={10000}
            step={50}
            value={day.calorieTarget}
            onChange={(e) => handleCalorieTargetChange(Number(e.target.value))}
            className={styles.targetInput}
            aria-label={`Calorie target for ${formatPlanDate(day.date)}`}
          />
          <span className={styles.targetUnit}>kcal</span>
        </label>
      </header>

      <CalorieBar
        consumed={dayTotals.calories}
        target={day.calorieTarget}
        compact
      />

      <div className={styles.macros}>
        <span>P {Math.round(dayTotals.protein)}g</span>
        <span>C {Math.round(dayTotals.carbs)}g</span>
        <span>F {Math.round(dayTotals.fat)}g</span>
      </div>

      <div className={styles.meals}>
        {day.meals.map((slot, slotIndex) => (
          <MealSlotCard
            key={slot.id}
            slot={slot}
            savedMeals={savedMeals}
            onAddItem={(entry) => handleAddItem(slotIndex, entry)}
            onRemoveItem={(itemId) => handleRemoveItem(slotIndex, itemId)}
            onSaveAsTemplate={onSaveMealTemplate}
            foodModalOpen={activeSlotId === slot.id}
            onOpenFoodModal={() => setActiveSlotId(slot.id)}
            onCloseFoodModal={() => setActiveSlotId(null)}
          />
        ))}
      </div>
    </article>
  )
}

export default DayPanel
