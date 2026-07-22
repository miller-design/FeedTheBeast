import { createServerFn } from '@tanstack/react-start'

import { parseRecipeFromHtml } from '#/lib/recipe-import'
import type { ImportedRecipeDraft } from '#/types/recipe'

type ImportRecipeInput = {
  url: string
}

type ImportRecipeResult =
  | { success: true; recipe: ImportedRecipeDraft }
  | { success: false; error: string }

/**
 * Server function to fetch a recipe URL and extract schema.org JSON-LD data.
 * Runs server-side to bypass browser CORS restrictions.
 *
 * @param data.url - Full recipe page URL e.g. `"https://www.seriouseats.com/..."`
 * @returns Parsed recipe draft or error message
 *
 * @example
 * const result = await importRecipeFromUrl({ data: { url: 'https://...' } })
 */
export const importRecipeFromUrl = createServerFn({ method: 'POST' })
  .validator((input: ImportRecipeInput) => input)
  .handler(async ({ data }): Promise<ImportRecipeResult> => {
    const { url } = data

    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { success: false, error: 'Only HTTP and HTTPS URLs are supported.' }
      }
    } catch {
      return { success: false, error: 'Invalid URL.' }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FeedTheBeast/1.0 (Recipe Import)',
          Accept: 'text/html',
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Could not fetch page (HTTP ${response.status}).`,
        }
      }

      const html = await response.text()
      const recipe = parseRecipeFromHtml(html, url)

      if (!recipe) {
        return {
          success: false,
          error:
            'No recipe data found. The site may not use schema.org markup. Try Serious Eats, BBC Good Food, or AllRecipes.',
        }
      }

      return { success: true, recipe }
    } catch {
      return {
        success: false,
        error: 'Failed to fetch recipe. Check the URL and try again.',
      }
    }
  })
