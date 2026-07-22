import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import recipeStyles from '#/components/RecipeDetailPanel/styles.module.css'
import type { FoodEntry } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

import type { PlanItemDetailPanelProps, PlanItemSelection } from './types'
import styles from './styles.module.css'

/**
 * Builds a subtitle for a recipe item shown in the plan detail panel.
 *
 * @param recipe - Linked recipe from the library
 * @param item - Food entry in the meal slot
 * @returns Meta line e.g. `"311 kcal/serving · 2 servings in plan"`
 */
function buildRecipeSubtitle(recipe: Recipe, item: FoodEntry): string {
  const parts = [
    `${recipe.nutrition.calories} kcal/serving`,
    `${item.recipeServings ?? item.quantity} serving${
      (item.recipeServings ?? item.quantity) !== 1 ? 's' : ''
    } in plan`,
  ]

  if (recipe.prepTimeMinutes != null) {
    parts.push(`${recipe.prepTimeMinutes}m prep`)
  }

  if (recipe.cookTimeMinutes != null) {
    parts.push(`${recipe.cookTimeMinutes}m cook`)
  }

  if (recipe.sourceSite) {
    parts.push(recipe.sourceSite)
  }

  return parts.join(' · ')
}

/**
 * Builds a subtitle for a non-recipe food entry in the plan detail panel.
 *
 * @param item - Food entry from a meal slot
 * @returns Meta line e.g. `"150 g · Open Food Facts"`
 */
function buildFoodSubtitle(item: FoodEntry): string {
  const quantity = `${item.quantity} ${item.unit}`

  if (item.source === 'openfoodfacts') {
    return `${quantity} · Open Food Facts`
  }

  if (item.source === 'manual') {
    return `${quantity} · Manual entry`
  }

  return quantity
}

type NutritionSectionProps = {
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * Renders a four-macro nutrition grid for plan item detail views.
 *
 * @param props.title - Section heading e.g. `"In this meal"`
 * @param props.calories - Calorie total
 * @param props.protein - Protein in grams
 * @param props.carbs - Carbs in grams
 * @param props.fat - Fat in grams
 *
 * @example
 * <NutritionSection title="In this meal" calories={620} protein={42} carbs={55} fat={18} />
 */
function NutritionSection({
  title,
  calories,
  protein,
  carbs,
  fat,
}: NutritionSectionProps) {
  return (
    <section className={recipeStyles.section}>
      <h3 className={recipeStyles.sectionTitle}>{title}</h3>
      <dl className={recipeStyles.nutritionGrid}>
        <div>
          <dt>Calories</dt>
          <dd>{Math.round(calories)} kcal</dd>
        </div>
        <div>
          <dt>Protein</dt>
          <dd>{Math.round(protein)}g</dd>
        </div>
        <div>
          <dt>Carbs</dt>
          <dd>{Math.round(carbs)}g</dd>
        </div>
        <div>
          <dt>Fat</dt>
          <dd>{Math.round(fat)}g</dd>
        </div>
      </dl>
    </section>
  )
}

/**
 * Slide-in panel showing meal item details for a plan in use mode.
 *
 * @param props.selection - Selected meal item and optional linked recipe
 * @param props.onClose - Close handler
 *
 * @example
 * <PlanItemDetailPanel selection={{ item, recipe }} onClose={() => {}} />
 */
const PlanItemDetailPanel = ({ selection, onClose }: PlanItemDetailPanelProps) => {
  const open = selection != null

  const title = selection?.recipe?.name ?? selection?.item.name ?? ''
  const subtitle = selection
    ? selection.recipe
      ? buildRecipeSubtitle(selection.recipe, selection.item)
      : buildFoodSubtitle(selection.item)
    : undefined

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      titleId="plan-item-detail-title"
      width="wide"
      footer={
        selection?.recipe?.sourceUrl ? (
          <div className={styles.footerBar}>
            <a
              href={selection.recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={panelStyles.tertiaryBtn}
            >
              View original
            </a>
          </div>
        ) : undefined
      }
    >
      {selection && <PlanItemDetailContent selection={selection} />}
    </SlidePanel>
  )
}

type PlanItemDetailContentProps = {
  selection: PlanItemSelection
}

/** Renders scrollable body content for the plan item detail panel */
function PlanItemDetailContent({ selection }: PlanItemDetailContentProps) {
  const { item, recipe } = selection

  if (recipe) {
    return (
      <div className={styles.content}>
        <NutritionSection
          title="In this meal"
          calories={item.calories}
          protein={item.protein}
          carbs={item.carbs}
          fat={item.fat}
        />

        <section className={recipeStyles.section}>
          <h3 className={recipeStyles.sectionTitle}>
            Ingredients
            {recipe.ingredients.length > 0 && (
              <span className={recipeStyles.count}>{recipe.ingredients.length}</span>
            )}
          </h3>
          {recipe.ingredients.length > 0 ? (
            <ul className={recipeStyles.ingredientList}>
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id}>{ingredient.text}</li>
              ))}
            </ul>
          ) : (
            <p className={panelStyles.hint}>No ingredients saved for this recipe.</p>
          )}
        </section>

        <section className={recipeStyles.section}>
          <h3 className={recipeStyles.sectionTitle}>
            Method
            {recipe.instructions.length > 0 && (
              <span className={recipeStyles.count}>
                {recipe.instructions.length} steps
              </span>
            )}
          </h3>
          {recipe.instructions.length > 0 ? (
            <ol className={recipeStyles.methodList}>
              {recipe.instructions.map((step, index) => (
                <li key={`${recipe.id}-step-${index}`}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className={panelStyles.hint}>No cooking method saved for this recipe.</p>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <NutritionSection
        title="Nutrition"
        calories={item.calories}
        protein={item.protein}
        carbs={item.carbs}
        fat={item.fat}
      />

      {item.source === 'recipe' && (
        <p className={styles.missingRecipe}>
          This item was added from a recipe that is no longer in your library.
        </p>
      )}
    </div>
  )
}

export default PlanItemDetailPanel
