import { useEffect, useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'

import { scaleFrom100g } from '#/lib/nutrition'
import { DND_TYPES } from '#/lib/dnd'
import { searchFoods } from '#/server/search-foods'
import type { OffSearchResult } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

import type { FoodLibraryProps } from './types'
import styles from './styles.module.css'

type Tab = 'foods' | 'recipes'

type CalorieFilter = 'all' | 'under300' | '300to500' | 'over500'

const SEARCH_DEBOUNCE_MS = 350

const CALORIE_FILTERS: { value: CalorieFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'under300', label: '<300' },
  { value: '300to500', label: '300–500' },
  { value: 'over500', label: '500+' },
]

/**
 * Filters recipes by name, ingredients, and calorie range.
 *
 * @param recipes - Full recipe library
 * @param query - Search text e.g. `"chicken"`
 * @param calorieFilter - Calorie preset e.g. `"300to500"`
 * @returns Matching recipes
 *
 * @example
 * filterRecipes(recipes, 'chicken', 'under300')
 */
function filterRecipes(
  recipes: Recipe[],
  query: string,
  calorieFilter: CalorieFilter,
): Recipe[] {
  const normalizedQuery = query.trim().toLowerCase()

  return recipes.filter((recipe) => {
    const calories = recipe.nutrition.calories

    if (calorieFilter === 'under300' && calories >= 300) return false
    if (calorieFilter === '300to500' && (calories < 300 || calories > 500)) return false
    if (calorieFilter === 'over500' && calories <= 500) return false

    if (!normalizedQuery) return true

    if (recipe.name.toLowerCase().includes(normalizedQuery)) return true

    return recipe.ingredients.some((ingredient) =>
      ingredient.text.toLowerCase().includes(normalizedQuery),
    )
  })
}

/**
 * Right sidebar food library with draggable foods and recipes.
 *
 * @param props.recipes - User's recipe library
 * @param props.onManualFood - Opens manual food entry dialog
 *
 * @example
 * <FoodLibrary recipes={recipes} onManualFood={() => {}} />
 */
const FoodLibrary = ({ recipes, onManualFood }: FoodLibraryProps) => {
  const [tab, setTab] = useState<Tab>('foods')
  const [query, setQuery] = useState('')
  const [recipeQuery, setRecipeQuery] = useState('')
  const [calorieFilter, setCalorieFilter] = useState<CalorieFilter>('all')
  const [results, setResults] = useState<OffSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, recipeQuery, calorieFilter),
    [recipes, recipeQuery, calorieFilter],
  )

  /**
   * Debounced search — runs automatically as the user types (min 2 chars).
   */
  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      setSearching(false)
      return
    }

    setSearching(true)
    setError(null)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await searchFoods({ data: { query: trimmed } })

          if (response.success) {
            setResults(response.results)
            setError(response.results.length === 0 ? 'No products found.' : null)
          } else {
            setResults([])
            setError(response.error)
          }
        } catch {
          setResults([])
          setError('Search failed. Try again.')
        } finally {
          setSearching(false)
        }
      })()
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query])

  /**
   * Clears the search field and results.
   */
  function handleClearSearch() {
    setQuery('')
    setResults([])
    setError(null)
  }

  /**
   * Clears recipe search and calorie filter.
   */
  function handleClearRecipeFilters() {
    setRecipeQuery('')
    setCalorieFilter('all')
  }

  return (
    <aside className={styles.root}>
      <p className={styles.label}>Food Library</p>

      <div className={styles.tabs} role="tablist" aria-label="Food library tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'foods'}
          className={clsx(styles.tab, tab === 'foods' && styles.tabActive)}
          onClick={() => setTab('foods')}
        >
          Foods
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'recipes'}
          className={clsx(styles.tab, tab === 'recipes' && styles.tabActive)}
          onClick={() => setTab('recipes')}
        >
          Recipes
        </button>
      </div>

      {tab === 'foods' && (
        <div className={styles.panel}>
          <div className={styles.searchField}>
            <label htmlFor="food-search" className={styles.searchLabel}>
              Search foods
            </label>
            <div className={styles.searchRow}>
              <input
                id="food-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. chicken, oats, yogurt"
                className={styles.searchInput}
                autoComplete="off"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <button type="button" className={styles.manualBtn} onClick={onManualFood}>
            + Manual food
          </button>

          {searching && <p className={styles.hint}>Searching…</p>}
          {!searching && error && <p className={styles.error}>{error}</p>}
          {!searching && !error && query.trim().length < 2 && (
            <p className={styles.hint}>Type at least 2 characters to search Open Food Facts</p>
          )}

          {!searching && !error && results.length > 0 && (
            <ul className={styles.list}>
              {results.map((product) => (
                <DraggableFood key={product.barcode} product={product} />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'recipes' && (
        <div className={styles.panel}>
          {recipes.length === 0 ? (
            <p className={styles.hint}>
              No recipes yet. Add recipes from the Recipes page.
            </p>
          ) : (
            <>
              <div className={styles.searchField}>
                <label htmlFor="recipe-search" className={styles.searchLabel}>
                  Search recipes
                </label>
                <div className={styles.searchRow}>
                  <input
                    id="recipe-search"
                    type="search"
                    value={recipeQuery}
                    onChange={(e) => setRecipeQuery(e.target.value)}
                    placeholder="e.g. chicken, pasta"
                    className={styles.searchInput}
                    autoComplete="off"
                  />
                  {recipeQuery.length > 0 && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={() => setRecipeQuery('')}
                      aria-label="Clear recipe search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.filterField}>
                <span className={styles.searchLabel}>Calories / serving</span>
                <div className={styles.calorieFilters} role="group" aria-label="Calorie filter">
                  {CALORIE_FILTERS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={clsx(
                        styles.calorieFilterBtn,
                        calorieFilter === option.value && styles.calorieFilterActive,
                      )}
                      onClick={() => setCalorieFilter(option.value)}
                      aria-pressed={calorieFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRecipes.length === 0 ? (
                <p className={styles.hint}>
                  No recipes match your search.
                  {(recipeQuery.length > 0 || calorieFilter !== 'all') && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className={styles.resetLink}
                        onClick={handleClearRecipeFilters}
                      >
                        Clear filters
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <ul className={styles.list}>
                  {filteredRecipes.map((recipe) => (
                    <DraggableRecipe key={recipe.id} recipe={recipe} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  )
}

type DraggableFoodProps = {
  product: OffSearchResult
}

/** Draggable food product from Open Food Facts search */
function DraggableFood({ product }: DraggableFoodProps) {
  const grams = product.servingSizeG ?? 100
  const scaled = scaleFrom100g(
    {
      calories: product.caloriesPer100g,
      protein: product.proteinPer100g,
      carbs: product.carbsPer100g,
      fat: product.fatPer100g,
    },
    grams,
  )

  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `library-food-${product.barcode}`,
      data: {
        type: DND_TYPES.LIBRARY_FOOD,
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        ...scaled,
        quantity: grams,
        unit: 'g',
        source: 'openfoodfacts' as const,
        barcode: product.barcode,
        servingSizeG: grams,
      },
    })

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.item, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
    >
      <span className={styles.itemName}>{product.name}</span>
      {product.brand && <span className={styles.itemBrand}>{product.brand}</span>}
      <span className={styles.itemMeta}>
        {scaled.calories} kcal · drag to add
      </span>
    </li>
  )
}

type DraggableRecipeProps = {
  recipe: Recipe
}

/** Draggable recipe from the user's library */
function DraggableRecipe({ recipe }: DraggableRecipeProps) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `library-recipe-${recipe.id}`,
      data: {
        type: DND_TYPES.LIBRARY_RECIPE,
        recipeId: recipe.id,
        name: recipe.name,
        calories: recipe.nutrition.calories,
        protein: recipe.nutrition.protein,
        carbs: recipe.nutrition.carbs,
        fat: recipe.nutrition.fat,
        servings: 1,
      },
    })

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.item, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
    >
      <span className={styles.itemName}>{recipe.name}</span>
      <span className={styles.itemMeta}>
        {recipe.nutrition.calories} kcal/serving · drag to add
      </span>
    </li>
  )
}

export default FoodLibrary
