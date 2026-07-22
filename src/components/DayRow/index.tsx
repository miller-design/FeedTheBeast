import { formatPlanDate } from '#/lib/dates'

import MacroSummary from '#/components/MacroSummary'
import MealDropZone from '#/components/MealDropZone'

import type { DayRowProps } from './types'
import styles from './styles.module.css'

/**
 * One day row in the meal plan grid — date header, macro bar, horizontal meal slots.
 *
 * @param props.day - Plan day data
 * @param props.dayIndex - Index in the plan's days array
 * @param props.onCalorieTargetChange - Updates daily calorie target
 * @param props.onRemoveItem - Removes a food item from a slot
 *
 * @example
 * <DayRow day={planDay} dayIndex={0} onCalorieTargetChange={...} onRemoveItem={...} />
 */
const DayRow = ({
  day,
  dayIndex,
  readOnly = false,
  selectedItemId,
  onSelectItem,
  onCalorieTargetChange,
  onRemoveItem,
}: DayRowProps) => {
  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <div className={styles.dayInfo}>
          <span className={styles.dayLabel}>Day {dayIndex + 1}</span>
          <h3 className={styles.date}>{formatPlanDate(day.date)}</h3>
        </div>
        {readOnly ? (
          <p className={styles.targetValue}>
            <span>Target</span>
            <strong>{day.calorieTarget}</strong>
            <span>kcal</span>
          </p>
        ) : (
          <label className={styles.targetField}>
            <span>Target</span>
            <input
              type="number"
              min={500}
              max={10000}
              step={50}
              value={day.calorieTarget}
              onChange={(e) => onCalorieTargetChange(Number(e.target.value))}
              aria-label={`Calorie target for day ${dayIndex + 1}`}
            />
            <span>kcal</span>
          </label>
        )}
      </header>

      <MacroSummary day={day} />

      <div className={styles.meals}>
        {day.meals.map((slot, slotIndex) => (
          <MealDropZone
            key={slot.id}
            slot={slot}
            dayIndex={dayIndex}
            slotIndex={slotIndex}
            readOnly={readOnly}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            onRemoveItem={(itemId) => onRemoveItem(slotIndex, itemId)}
          />
        ))}
      </div>
    </article>
  )
}

export default DayRow
