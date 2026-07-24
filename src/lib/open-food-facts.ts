import type { OffSearchResult } from '#/types/meal-plan'

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'

type OffNutriments = {
  'energy-kcal_100g'?: number
  'energy-kcal'?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
}

type OffProduct = {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: OffNutriments
  serving_size?: string
  serving_quantity?: number | string
}

type OffSearchResponse = {
  products?: OffProduct[]
}

/**
 * Parses numeric nutriments from an Open Food Facts product.
 *
 * @param nutriments - Raw nutriments object from OFF API
 * @returns Normalised per-100g macro values
 */
function parseNutriments(nutriments: OffNutriments | undefined): {
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
} {
  const caloriesPer100g =
    nutriments?.['energy-kcal_100g'] ?? nutriments?.['energy-kcal'] ?? 0

  return {
    caloriesPer100g: Math.round(caloriesPer100g),
    proteinPer100g: nutriments?.proteins_100g ?? 0,
    carbsPer100g: nutriments?.carbohydrates_100g ?? 0,
    fatPer100g: nutriments?.fat_100g ?? 0,
  }
}

/**
 * Maps a raw OFF product to the app's search result shape.
 *
 * @param product - Product object from OFF API response
 * @returns Mapped result or null if insufficient data
 */
function mapOffProduct(product: OffProduct): OffSearchResult | null {
  const barcode = product.code
  const name = product.product_name?.trim()

  if (!barcode || !name) return null

  const macros = parseNutriments(product.nutriments)
  const servingQuantity =
    typeof product.serving_quantity === 'string'
      ? parseFloat(product.serving_quantity)
      : product.serving_quantity

  return {
    barcode,
    name,
    brand: product.brands?.split(',')[0]?.trim(),
    ...macros,
    servingSizeG: servingQuantity,
  }
}

/**
 * Searches Open Food Facts for products matching a query string.
 * Uses the legacy search endpoint which supports full-text search.
 *
 * @param query - Search terms e.g. `"oatmeal"`
 * @param pageSize - Max results to return (default 20)
 * @returns Array of mapped search results
 *
 * @example
 * const results = await searchOpenFoodFacts('greek yogurt')
 */
export async function searchOpenFoodFacts(
  query: string,
  pageSize = 20,
): Promise<OffSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    action: 'process',
    search_terms: trimmed,
    json: 'true',
    page_size: String(pageSize),
    fields:
      'code,product_name,brands,nutriments,serving_size,serving_quantity',
  })

  const response = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': 'FeedTheBeast/1.0 (Meal Planner; contact@local)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to search Open Food Facts')
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    // OFF sometimes serves an HTML “temporarily unavailable” page with HTTP 200.
    throw new Error('Open Food Facts is temporarily unavailable')
  }

  const data = (await response.json()) as OffSearchResponse
  const products = data.products ?? []

  return products
    .map(mapOffProduct)
    .filter((result): result is OffSearchResult => result !== null)
}

/**
 * Fetches a single product from Open Food Facts by barcode.
 *
 * @param barcode - Product barcode e.g. `"5000112546415"`
 * @returns Mapped product or null if not found
 *
 * @example
 * const product = await getOpenFoodFactsProduct('5000112546415')
 */
export async function getOpenFoodFactsProduct(
  barcode: string,
): Promise<OffSearchResult | null> {
  const response = await fetch(`${OFF_PRODUCT_URL}/${barcode}.json`, {
    headers: {
      'User-Agent': 'FeedTheBeast/1.0 (Meal Planner; contact@local)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) return null

  const data = (await response.json()) as { product?: OffProduct }
  if (!data.product) return null

  return mapOffProduct({ ...data.product, code: barcode })
}
