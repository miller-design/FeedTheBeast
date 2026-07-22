import clsx from 'clsx'

import { calorieProgress } from '#/lib/nutrition'

import type { CalorieBarProps } from './types'
import styles from './styles.module.css'

/**
 * Visual progress bar showing calories consumed vs daily target.
 *
 * @param props.consumed - Calories eaten so far
 * @param props.target - Daily calorie goal
 * @param props.compact - Smaller variant for dense layouts
 *
 * @example
 * <CalorieBar consumed={1800} target={2000} />
 */
const CalorieBar = ({ consumed, target, compact = false }: CalorieBarProps) => {
  const progress = calorieProgress(consumed, target)
  const isOver = consumed > target
  const remaining = target - consumed

  return (
    <div className={clsx(styles.root, compact && styles.compact)}>
      <div className={styles.header}>
        <span className={styles.consumed}>{Math.round(consumed)} kcal</span>
        <span className={styles.target}>/ {target} kcal</span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={clsx(styles.fill, isOver && styles.over)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className={clsx(styles.remaining, isOver && styles.overText)}>
        {isOver
          ? `${Math.round(consumed - target)} kcal over`
          : `${Math.round(remaining)} kcal remaining`}
      </span>
    </div>
  )
}

export default CalorieBar
