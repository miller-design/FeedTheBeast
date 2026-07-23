import type { RecipeEmptyStateProps } from './types'
import styles from './styles.module.css'

const STEPS = [
  {
    number: '01',
    title: 'Save from plan',
    description:
      'Use "Save meal" on any meal slot in a plan to quick-save it to your library.',
  },
  {
    number: '02',
    title: 'Or build fresh',
    description:
      'Create a recipe manually with ingredients, portions, and nutrition info.',
  },
  {
    number: '03',
    title: 'Drop into any meal',
    description:
      'Drag recipes from the Food Library into any meal slot while planning.',
  },
] as const

/**
 * Empty state for the recipe library when no recipes are saved.
 *
 * @param props.onNewRecipe - Opens the new recipe dialog
 * @param props.onImportUrl - Opens the import from URL dialog
 *
 * @example
 * <RecipeEmptyState onNewRecipe={() => {}} onImportUrl={() => {}} />
 */
const RecipeEmptyState = ({ onNewRecipe, onImportUrl }: RecipeEmptyStateProps) => {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>No recipes yet</p>
        <h2 className={styles.title}>Build a recipe library</h2>
        <p className={styles.description}>
          Save meals from your plans, build recipes from scratch, or import from
          food blogs. Recipes drop into any meal at a uniform scale.
        </p>
        <div className={styles.heroActions}>
          <button type="button" className={styles.primaryBtn} onClick={onNewRecipe}>
            + New recipe
          </button>
          <button type="button" className={styles.linkBtn} onClick={onImportUrl}>
            Import recipe
          </button>
        </div>
      </section>

      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step.number} className={styles.step}>
            <span className={styles.stepNumber}>{step.number}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default RecipeEmptyState
