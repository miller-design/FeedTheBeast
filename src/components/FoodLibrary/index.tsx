import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'

import { useMediaQuery } from '#/hooks/useMediaQuery'
import { scaleFrom100g } from '#/lib/nutrition'
import { DND_TYPES } from '#/lib/dnd'
import {
  RECIPE_TAGS,
  RECIPE_TAG_LABELS,
  toggleRecipeTag,
} from '#/lib/recipe-tags'
import type { RecipeTag } from '#/lib/recipe-tags'
import { searchFoods } from '#/server/search-foods'
import type { OffSearchResult } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

import type { FoodLibraryProps, LibraryPlacePayload } from './types'
import styles from './styles.module.css'

type Tab = 'foods' | 'recipes'

type CalorieFilter = 'all' | 'under300' | '300to500' | 'over500'

/** Floating cursor-follow preview for a recipe with an image */
type RecipeHoverPreview = {
  imageUrl: string
  name: string
  x: number
  y: number
}

const PREVIEW_OFFSET_X = 16
const PREVIEW_OFFSET_Y = 16
const PREVIEW_WIDTH = 220
const PREVIEW_HEIGHT = 124

const SEARCH_DEBOUNCE_MS = 350

const CALORIE_FILTERS: { value: CalorieFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'under300', label: '<300' },
  { value: '300to500', label: '300–500' },
  { value: 'over500', label: '500+' },
]

/**
 * Returns a recipe's tags, defaulting to an empty list for legacy records.
 *
 * @param recipe - Recipe that may predate the tags field
 * @returns Controlled tags array
 */
function recipeTags(recipe: Recipe): RecipeTag[] {
  return Array.isArray(recipe.tags) ? recipe.tags : []
}

/**
 * Filters recipes by name, ingredients, calorie range, and meal-type tags.
 *
 * Tag filters use OR matching: a recipe matches if it has any selected tag.
 * When no tags are selected, tag filtering is skipped.
 *
 * @param recipes - Full recipe library
 * @param query - Search text e.g. `"chicken"`
 * @param calorieFilter - Calorie preset e.g. `"300to500"`
 * @param tagFilters - Selected meal-type tags e.g. `['breakfast']`
 * @returns Matching recipes
 *
 * @example
 * filterRecipes(recipes, 'chicken', 'under300', ['lunch'])
 */
function filterRecipes(
  recipes: Recipe[],
  query: string,
  calorieFilter: CalorieFilter,
  tagFilters: RecipeTag[],
): Recipe[] {
  const normalizedQuery = query.trim().toLowerCase()

  return recipes.filter((recipe) => {
    const calories = recipe.nutrition.calories
    const tags = recipeTags(recipe)

    if (calorieFilter === 'under300' && calories >= 300) return false
    if (calorieFilter === '300to500' && (calories < 300 || calories > 500)) return false
    if (calorieFilter === 'over500' && calories <= 500) return false

    if (tagFilters.length > 0 && !tagFilters.some((tag) => tags.includes(tag))) {
      return false
    }

    if (!normalizedQuery) return true

    if (recipe.name.toLowerCase().includes(normalizedQuery)) return true

    return recipe.ingredients.some((ingredient) =>
      ingredient.text.toLowerCase().includes(normalizedQuery),
    )
  })
}

/**
 * Right sidebar food library with draggable foods and recipes.
 * Below `--bp-xl` it becomes a right-edge drawer with the same `0.4s ease`
 * fade/slide as SlidePanel.
 *
 * @param props.recipes - User's recipe library
 * @param props.onManualFood - Opens manual food entry dialog
 * @param props.onPlaceRequest - Tap-to-place handler for touch devices
 * @param props.mobileOpen - Whether the mobile drawer is visible
 * @param props.onMobileClose - Closes the mobile drawer
 *
 * @example
 * <FoodLibrary
 *   recipes={recipes}
 *   onManualFood={() => {}}
 *   onPlaceRequest={handlePlace}
 *   mobileOpen={libraryOpen}
 *   onMobileClose={() => setLibraryOpen(false)}
 * />
 */
const FoodLibrary = ({
  recipes,
  onManualFood,
  onPlaceRequest,
  mobileOpen = false,
  onMobileClose,
}: FoodLibraryProps) => {
  const [tab, setTab] = useState<Tab>('foods')
  const [query, setQuery] = useState('')
  const [recipeQuery, setRecipeQuery] = useState('')
  const [calorieFilter, setCalorieFilter] = useState<CalorieFilter>('all')
  const [tagFilters, setTagFilters] = useState<RecipeTag[]>([])
  const [results, setResults] = useState<OffSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoverPreview, setHoverPreview] = useState<RecipeHoverPreview | null>(null)
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const finePointerRef = useRef(true)
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, recipeQuery, calorieFilter, tagFilters),
    [recipes, recipeQuery, calorieFilter, tagFilters],
  )

  const hasActiveRecipeFilters =
    recipeQuery.length > 0 || calorieFilter !== 'all' || tagFilters.length > 0

  const drawerOpen = isDesktop || mobileOpen

  useEffect(() => {
    if (isDesktop) {
      setMounted(true)
      setEntered(true)
      return
    }

    if (!mobileOpen) return
    setMounted(true)
  }, [isDesktop, mobileOpen])

  useEffect(() => {
    if (isDesktop || !mounted) return

    if (!mobileOpen) {
      setEntered(false)

      const exitTimer = window.setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, 400)

      return () => {
        window.clearTimeout(exitTimer)
      }
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    document.body.style.overflow = 'hidden'

    /**
     * Closes the library drawer when the user presses Escape.
     *
     * @param event - Native keyboard event from the document
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onMobileClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDesktop, mounted, mobileOpen, onMobileClose])

  useEffect(() => {
    if (isDesktop || mounted) return
    document.body.style.overflow = ''
  }, [isDesktop, mounted])

  /**
   * Enables cursor-follow previews only on fine pointers (mouse / trackpad).
   */
  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)')

    /**
     * Syncs the fine-pointer flag from the media query.
     */
    function syncPointer() {
      finePointerRef.current = media.matches
      if (!media.matches) setHoverPreview(null)
    }

    syncPointer()
    media.addEventListener('change', syncPointer)
    return () => media.removeEventListener('change', syncPointer)
  }, [])

  /**
   * Clears the hover preview when leaving the recipes tab.
   */
  useEffect(() => {
    if (tab !== 'recipes') setHoverPreview(null)
  }, [tab])

  /**
   * Positions the floating preview near the cursor, clamped to the viewport.
   *
   * @param clientX - Pointer X from the event e.g. `420`
   * @param clientY - Pointer Y from the event e.g. `280`
   * @param imageUrl - Recipe image URL to show
   * @param name - Recipe name used for the preview alt text
   *
   * @example
   * showRecipePreview(420, 280, recipe.imageUrl, recipe.name)
   */
  const showRecipePreview = useCallback(
    (clientX: number, clientY: number, imageUrl: string, name: string) => {
      if (!finePointerRef.current) return

      const maxX = window.innerWidth - PREVIEW_WIDTH - 8
      const maxY = window.innerHeight - PREVIEW_HEIGHT - 8
      const x = Math.min(Math.max(8, clientX + PREVIEW_OFFSET_X), maxX)
      const y = Math.min(Math.max(8, clientY + PREVIEW_OFFSET_Y), maxY)

      setHoverPreview({ imageUrl, name, x, y })
    },
    [],
  )

  /**
   * Hides the floating recipe image preview.
   */
  const hideRecipePreview = useCallback(() => {
    setHoverPreview(null)
  }, [])

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
            setError(null)
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
   * Clears recipe search, calorie, and tag filters.
   */
  function handleClearRecipeFilters() {
    setRecipeQuery('')
    setCalorieFilter('all')
    setTagFilters([])
  }

  if (!mounted && !isDesktop) return null

  const showOverlay = !isDesktop && mounted

  return (
    <>
      {showOverlay && (
        <div
          className={clsx(styles.overlay, entered && styles.overlayVisible)}
          onClick={() => onMobileClose?.()}
          role="presentation"
        />
      )}

      <aside
        className={clsx(
          styles.root,
          (isDesktop || (drawerOpen && entered)) && styles.rootVisible,
        )}
        aria-label="Food library"
        aria-hidden={!isDesktop && !entered ? true : undefined}
      >
        <div className={styles.drawerHeader}>
          <p className={styles.label}>Food Library</p>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onMobileClose?.()}
            aria-label="Close food library"
          >
            ×
          </button>
        </div>

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
          {!searching && !error && query.trim().length >= 2 && results.length === 0 && (
            <p className={styles.hint}>
              No matching foods. Try a different search or add a manual food.
            </p>
          )}

          {!searching && !error && results.length > 0 && (
            <ul className={styles.list}>
              {results.map((product) => (
                <DraggableFood
                  key={product.barcode}
                  product={product}
                  onPlaceRequest={onPlaceRequest}
                />
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
                <span className={styles.searchLabel}>Meal type</span>
                <div className={styles.tagFilters} role="group" aria-label="Meal type filter">
                  {RECIPE_TAGS.map((tag) => {
                    const active = tagFilters.includes(tag)

                    return (
                      <button
                        key={tag}
                        type="button"
                        className={clsx(
                          styles.tagFilterBtn,
                          active && styles.tagFilterActive,
                        )}
                        onClick={() => setTagFilters(toggleRecipeTag(tagFilters, tag))}
                        aria-pressed={active}
                      >
                        {RECIPE_TAG_LABELS[tag]}
                      </button>
                    )
                  })}
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
                  {hasActiveRecipeFilters && (
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
                    <DraggableRecipe
                      key={recipe.id}
                      recipe={recipe}
                      onPreviewMove={showRecipePreview}
                      onPreviewHide={hideRecipePreview}
                      onPlaceRequest={onPlaceRequest}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {hoverPreview &&
        createPortal(
          <div
            className={styles.hoverPreview}
            style={{
              transform: `translate3d(${hoverPreview.x}px, ${hoverPreview.y}px, 0)`,
            }}
            aria-hidden
          >
            <img
              src={hoverPreview.imageUrl}
              alt=""
              className={styles.hoverPreviewImage}
              decoding="async"
            />
            <span className={styles.hoverPreviewLabel}>{hoverPreview.name}</span>
          </div>,
          document.body,
        )}
      </aside>
    </>
  )
}

type DraggableFoodProps = {
  product: OffSearchResult
  onPlaceRequest?: (payload: LibraryPlacePayload) => void
}

/**
 * Draggable food product from Open Food Facts search, with a tap-to-place add button.
 *
 * @param props.product - Open Food Facts search result
 * @param props.onPlaceRequest - Starts tap-to-place mode for this food
 *
 * @example
 * <DraggableFood product={product} onPlaceRequest={handlePlace} />
 */
function DraggableFood({ product, onPlaceRequest }: DraggableFoodProps) {
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

  const placeData: LibraryPlacePayload = {
    type: DND_TYPES.LIBRARY_FOOD,
    name: product.brand ? `${product.name} (${product.brand})` : product.name,
    ...scaled,
    quantity: grams,
    unit: 'g',
    source: 'openfoodfacts' as const,
    barcode: product.barcode,
    servingSizeG: grams,
  }

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-food-${product.barcode}`,
    data: placeData,
  })

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.item, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
    >
      <div className={styles.itemBody}>
        <span className={styles.itemName}>{product.name}</span>
        {product.brand && <span className={styles.itemBrand}>{product.brand}</span>}
        <span className={styles.itemMeta}>
          {scaled.calories} kcal · drag or tap +
        </span>
      </div>
      {onPlaceRequest && (
        <button
          type="button"
          className={styles.addBtn}
          aria-label={`Add ${product.name} to a meal`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onPlaceRequest(placeData)
          }}
        >
          +
        </button>
      )}
    </li>
  )
}

type DraggableRecipeProps = {
  recipe: Recipe
  /**
   * Shows / repositions the floating image preview while the pointer
   * moves over a recipe that has `imageUrl`.
   *
   * @param clientX - Pointer X e.g. `420`
   * @param clientY - Pointer Y e.g. `280`
   * @param imageUrl - Recipe image URL
   * @param name - Recipe display name
   */
  onPreviewMove: (
    clientX: number,
    clientY: number,
    imageUrl: string,
    name: string,
  ) => void
  /** Hides the floating image preview when the pointer leaves */
  onPreviewHide: () => void
  onPlaceRequest?: (payload: LibraryPlacePayload) => void
}

/**
 * Draggable recipe from the user's library. When the recipe has an image,
 * hovering with a fine pointer shows a cursor-follow preview.
 *
 * @param props.recipe - Library recipe to drag into a meal slot
 * @param props.onPreviewMove - Updates the shared hover preview position/image
 * @param props.onPreviewHide - Clears the shared hover preview
 * @param props.onPlaceRequest - Starts tap-to-place mode for this recipe
 *
 * @example
 * <DraggableRecipe
 *   recipe={recipe}
 *   onPreviewMove={showRecipePreview}
 *   onPreviewHide={hideRecipePreview}
 *   onPlaceRequest={handlePlace}
 * />
 */
function DraggableRecipe({
  recipe,
  onPreviewMove,
  onPreviewHide,
  onPlaceRequest,
}: DraggableRecipeProps) {
  const tags = recipeTags(recipe)
  const imageUrl = recipe.imageUrl

  const placeData: LibraryPlacePayload = {
    type: DND_TYPES.LIBRARY_RECIPE,
    recipeId: recipe.id,
    name: recipe.name,
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs,
    fat: recipe.nutrition.fat,
    servings: 1,
  }

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-recipe-${recipe.id}`,
    data: placeData,
  })

  useEffect(() => {
    if (isDragging) onPreviewHide()
  }, [isDragging, onPreviewHide])

  /**
   * Starts or updates the floating preview for recipes that have an image.
   *
   * @param event - Pointer event from the recipe row
   */
  function handlePointerMove(event: React.PointerEvent<HTMLLIElement>) {
    if (!imageUrl || isDragging) return
    onPreviewMove(event.clientX, event.clientY, imageUrl, recipe.name)
  }

  return (
    <li
      ref={setNodeRef}
      className={clsx(styles.item, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
      onPointerEnter={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerLeave={onPreviewHide}
    >
      <div className={styles.itemBody}>
        <span className={styles.itemName}>{recipe.name}</span>
        {tags.length > 0 && (
          <span className={styles.itemTags}>
            {tags.map((tag) => RECIPE_TAG_LABELS[tag]).join(' · ')}
          </span>
        )}
        <span className={styles.itemMeta}>
          {recipe.nutrition.calories} kcal/serving · drag or tap +
        </span>
      </div>
      {onPlaceRequest && (
        <button
          type="button"
          className={styles.addBtn}
          aria-label={`Add ${recipe.name} to a meal`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onPlaceRequest(placeData)
          }}
        >
          +
        </button>
      )}
    </li>
  )
}

export default FoodLibrary
