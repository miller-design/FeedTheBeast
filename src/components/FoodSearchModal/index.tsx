import { useState } from 'react'
import clsx from 'clsx'

import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { createId } from '#/lib/meal-plan-factory'
import { scaleFrom100g } from '#/lib/nutrition'
import { searchFoods } from '#/server/search-foods'
import type { FoodEntry, OffSearchResult } from '#/types/meal-plan'

import type { FoodSearchModalProps } from './types'
import styles from './styles.module.css'

type Tab = 'search' | 'manual'

const MANUAL_FORM_ID = 'food-search-manual-form'

/**
 * Slide-in panel for adding food via Open Food Facts search or manual entry.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onAdd - Called with a new FoodEntry when user confirms
 *
 * @example
 * <FoodSearchModal open onClose={() => {}} onAdd={(entry) => {}} />
 */
const FoodSearchModal = ({ open, onClose, onAdd }: FoodSearchModalProps) => {
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OffSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [manualName, setManualName] = useState('')
  const [manualCalories, setManualCalories] = useState(0)
  const [manualProtein, setManualProtein] = useState(0)
  const [manualCarbs, setManualCarbs] = useState(0)
  const [manualFat, setManualFat] = useState(0)
  const [manualQuantity, setManualQuantity] = useState(1)

  /**
   * Resets panel state and closes.
   */
  function handleClose() {
    setTab('search')
    setQuery('')
    setResults([])
    setSearchError(null)
    setManualName('')
    setManualCalories(0)
    setManualProtein(0)
    setManualCarbs(0)
    setManualFat(0)
    setManualQuantity(1)
    onClose()
  }

  /**
   * Runs an Open Food Facts search for the current query.
   */
  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) return

    setSearching(true)
    setSearchError(null)

    try {
      const response = await searchFoods({ data: { query: query.trim() } })

      if (!response.success) {
        setSearchError(response.error)
        setResults([])
        return
      }

      setResults(response.results)
      if (response.results.length === 0) {
        setSearchError('No products found. Try different search terms.')
      }
    } catch {
      setSearchError('Search failed. Please try again in a moment.')
    } finally {
      setSearching(false)
    }
  }

  /**
   * Adds a selected OFF product as a food entry using default serving size.
   *
   * @param product - Selected Open Food Facts result
   */
  function handleSelectProduct(product: OffSearchResult) {
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

    const entry: FoodEntry = {
      id: createId(),
      name: product.brand ? `${product.name} (${product.brand})` : product.name,
      ...scaled,
      quantity: grams,
      unit: 'g',
      servingSizeG: grams,
      source: 'openfoodfacts',
      barcode: product.barcode,
    }

    onAdd(entry)
    handleClose()
  }

  /**
   * Adds a manually entered food item.
   */
  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!manualName.trim()) return

    const entry: FoodEntry = {
      id: createId(),
      name: manualName.trim(),
      calories: manualCalories,
      protein: manualProtein,
      carbs: manualCarbs,
      fat: manualFat,
      quantity: manualQuantity,
      unit: 'serving',
      source: 'manual',
    }

    onAdd(entry)
    handleClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="Add food"
      subtitle="Search Open Food Facts or enter nutrition manually."
      titleId="food-search-title"
      footer={
        tab === 'manual' ? (
          <>
            <button type="button" className={panelStyles.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              form={MANUAL_FORM_ID}
              className={panelStyles.submitBtn}
              disabled={!manualName.trim()}
            >
              Add food
            </button>
          </>
        ) : (
          <button type="button" className={panelStyles.cancelBtn} onClick={handleClose}>
            Close
          </button>
        )
      }
    >
      <div className={styles.tabs}>
        <button
          type="button"
          className={clsx(styles.tab, tab === 'search' && styles.tabActive)}
          onClick={() => setTab('search')}
        >
          Search database
        </button>
        <button
          type="button"
          className={clsx(styles.tab, tab === 'manual' && styles.tabActive)}
          onClick={() => setTab('manual')}
        >
          Manual entry
        </button>
      </div>

      {tab === 'search' && (
        <div className={styles.searchPanel}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Open Food Facts…"
              className={styles.searchInput}
            />
            <button type="submit" disabled={searching || query.trim().length < 2}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {searchError && <p className={panelStyles.error}>{searchError}</p>}

          <ul className={styles.results}>
            {results.map((product) => (
              <li key={product.barcode}>
                <button
                  type="button"
                  className={styles.resultBtn}
                  onClick={() => handleSelectProduct(product)}
                >
                  <span className={styles.resultName}>{product.name}</span>
                  {product.brand && (
                    <span className={styles.resultBrand}>{product.brand}</span>
                  )}
                  <span className={styles.resultMacros}>
                    {product.caloriesPer100g} kcal / 100g
                    {' · '}
                    P {product.proteinPer100g}g · C {product.carbsPer100g}g · F{' '}
                    {product.fatPer100g}g
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className={styles.attribution}>
            Data from{' '}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">
              Open Food Facts
            </a>
          </p>
        </div>
      )}

      {tab === 'manual' && (
        <form
          id={MANUAL_FORM_ID}
          onSubmit={handleManualSubmit}
          className={panelStyles.form}
        >
          <label className={panelStyles.field}>
            <span>Food name</span>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Homemade smoothie"
              required
            />
          </label>

          <div className={panelStyles.macroGrid}>
            <label className={panelStyles.field}>
              <span>Calories</span>
              <input
                type="number"
                min={0}
                value={manualCalories}
                onChange={(e) => setManualCalories(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Protein (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={manualProtein}
                onChange={(e) => setManualProtein(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Carbs (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={manualCarbs}
                onChange={(e) => setManualCarbs(Number(e.target.value))}
              />
            </label>
            <label className={panelStyles.field}>
              <span>Fat (g)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={manualFat}
                onChange={(e) => setManualFat(Number(e.target.value))}
              />
            </label>
          </div>

          <label className={panelStyles.field}>
            <span>Servings</span>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={manualQuantity}
              onChange={(e) => setManualQuantity(Number(e.target.value))}
            />
          </label>
        </form>
      )}
    </SlidePanel>
  )
}

export default FoodSearchModal
