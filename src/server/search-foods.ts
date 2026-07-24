import { createServerFn } from '@tanstack/react-start'

import { searchOpenFoodFacts } from '#/lib/open-food-facts'
import type { OffSearchResult } from '#/types/meal-plan'

type SearchFoodsInput = {
  query: string
  pageSize?: number
}

type SearchFoodsResult =
  | { success: true; results: OffSearchResult[] }
  | { success: false; error: string }

/**
 * Server function to search Open Food Facts without browser CORS restrictions.
 *
 * @param data.query - Search terms e.g. `"chicken breast"`
 * @param data.pageSize - Max results (default 20)
 * @returns Mapped product results or error message
 *
 * @example
 * const result = await searchFoods({ data: { query: 'oats' } })
 */
export const searchFoods = createServerFn({ method: 'POST' })
  .validator((input: SearchFoodsInput) => input)
  .handler(async ({ data }): Promise<SearchFoodsResult> => {
    const query = data.query.trim()

    if (query.length < 2) {
      return { success: false, error: 'Enter at least 2 characters.' }
    }

    try {
      const results = await searchOpenFoodFacts(query, data.pageSize ?? 20)
      return { success: true, results }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ''

      if (message.includes('temporarily unavailable')) {
        return {
          success: false,
          error:
            'The food database is temporarily unavailable. Try again shortly, or add a manual food.',
        }
      }

      return {
        success: false,
        error:
          'Couldn’t reach the food database. Check your connection and try again, or add a manual food.',
      }
    }
  })
