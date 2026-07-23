import { sumNutrition } from '#/lib/nutrition'

import type { MacroSummaryProps } from './types'
import styles from './styles.module.css'

/**
 * Horizontal macro summary bar for a plan day (Nutricalc-style).
 *
 * @param props.day - Plan day with meals and calorie target
 *
 * @example
 * <MacroSummary day={planDay} />
 */
const MacroSummary = ({ day }: MacroSummaryProps) => {
  const allItems = day.meals.flatMap((meal) => meal.items)
  const totals = sumNutrition(allItems)

  const metrics = [
    {
      label: 'Energy',
      unit: 'kcal',
      current: totals.calories,
      target: day.calorieTarget,
    },
    { label: 'Protein', unit: 'g', current: totals.protein, target: null },
    { label: 'Carbs', unit: 'g', current: totals.carbs, target: null },
    { label: 'Fat', unit: 'g', current: totals.fat, target: null },
  ]

  return (
    <div className={styles.root}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metric}>
          <span className={styles.label}>{metric.label}</span>
          <span className={styles.value}>
            {Math.round(metric.current)} {metric.unit}
          </span>
          {metric.target !== null && (
            <span className={styles.target}>
              / {metric.target} {metric.unit}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default MacroSummary
