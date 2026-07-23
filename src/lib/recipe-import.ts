import { suggestRecipeTags } from '#/lib/recipe-tags'
import type { ImportedRecipeDraft, RecipeNutrition } from '#/types/recipe'

type JsonLdNode = Record<string, unknown>

/**
 * Returns true when a JSON-LD node represents a schema.org Recipe.
 *
 * @param node - Parsed JSON-LD object
 * @returns Whether the node is a Recipe type
 */
function isRecipeNode(node: JsonLdNode): boolean {
  const type = node['@type']
  if (type === 'Recipe') return true
  return Array.isArray(type) && type.includes('Recipe')
}

/**
 * Normalises a recipe source URL for duplicate comparison.
 * Strips tracking query params, trailing slashes, and www prefix.
 *
 * @param url - Recipe page URL e.g. `"https://www.pinchofyum.com/granola/?utm_source=x"`
 * @returns Canonical comparison key e.g. `"https://pinchofyum.com/granola"`
 *
 * @example
 * normalizeRecipeSourceUrl('https://www.pinchofyum.com/granola/')
 */
export function normalizeRecipeSourceUrl(url: string): string {
  try {
    const parsed = new URL(url.trim())
    parsed.hash = ''
    parsed.search = ''
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${host}${path}`.toLowerCase()
  } catch {
    return url.trim().toLowerCase()
  }
}

/**
 * Parses an ISO 8601 duration string (e.g. PT30M) to minutes.
 *
 * @param duration - ISO duration string from schema.org
 * @returns Duration in minutes, or undefined if unparseable
 *
 * @example
 * parseDurationToMinutes('PT1H30M') // 90
 */
export function parseDurationToMinutes(duration: unknown): number | undefined {
  if (typeof duration !== 'string') return undefined

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return undefined

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const total = hours * 60 + minutes
  return total > 0 ? total : undefined
}

/**
 * Extracts a numeric value from schema.org nutrition strings like "250 calories".
 *
 * @param value - Raw nutrition string or number
 * @returns Parsed number or 0
 */
function parseNutritionNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const match = value.match(/[\d.]+/)
  return match ? Number(match[0]) : 0
}

/**
 * Maps schema.org NutritionInformation to app nutrition shape.
 *
 * @param nutrition - Raw nutrition object from JSON-LD
 * @returns Normalised per-serving nutrition
 */
function parseSchemaNutrition(nutrition: JsonLdNode | undefined): RecipeNutrition {
  if (!nutrition) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }

  return {
    calories: parseNutritionNumber(nutrition.calories),
    protein: parseNutritionNumber(nutrition.proteinContent),
    carbs: parseNutritionNumber(nutrition.carbohydrateContent),
    fat: parseNutritionNumber(nutrition.fatContent),
  }
}

/**
 * Normalises recipe instructions from various schema.org formats.
 *
 * @param instructions - Raw instructions array or string
 * @returns Flat list of instruction strings
 */
function parseInstructions(instructions: unknown): string[] {
  if (typeof instructions === 'string') return [instructions.trim()].filter(Boolean)

  if (!Array.isArray(instructions)) return []

  return instructions
    .map((step) => {
      if (typeof step === 'string') return step.trim()
      if (step && typeof step === 'object' && 'text' in step) {
        return String((step as JsonLdNode).text).trim()
      }
      return ''
    })
    .filter(Boolean)
}

/**
 * Normalises ingredient list from schema.org recipe data.
 *
 * @param ingredients - Raw ingredient array
 * @returns Flat list of ingredient strings
 */
function parseIngredients(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) return []
  return ingredients.map((item) => String(item).trim()).filter(Boolean)
}

/**
 * Parses recipe yield / servings from schema.org values.
 *
 * @param yieldValue - recipeYield field value
 * @returns Number of servings (defaults to 1)
 */
function parseServings(yieldValue: unknown): number {
  if (typeof yieldValue === 'number' && yieldValue > 0) return Math.round(yieldValue)

  if (typeof yieldValue === 'string') {
    const match = yieldValue.match(/\d+/)
    if (match) return Number(match[0])
  }

  if (Array.isArray(yieldValue) && yieldValue.length > 0) {
    return parseServings(yieldValue[0])
  }

  return 1
}

/**
 * Finds a Recipe node within parsed JSON-LD content.
 *
 * @param data - Parsed JSON-LD object or array
 * @returns Recipe node or null
 */
export function findRecipeInJsonLd(data: unknown): JsonLdNode | null {
  if (!data || typeof data !== 'object') return null

  const node = data as JsonLdNode

  if (isRecipeNode(node)) return node

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
  }

  const graph = node['@graph']
  if (Array.isArray(graph)) {
    for (const item of graph) {
      if (item && typeof item === 'object' && isRecipeNode(item as JsonLdNode)) {
        return item as JsonLdNode
      }
    }
  }

  return null
}

/**
 * Extracts all JSON-LD script blocks from an HTML document string.
 *
 * @param html - Full HTML page content
 * @returns Array of parsed JSON objects
 */
export function extractJsonLdFromHtml(html: string): unknown[] {
  const results: unknown[] = []
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  let match = pattern.exec(html)
  while (match) {
    try {
      results.push(JSON.parse(match[1]))
    } catch {
      // Skip malformed JSON-LD blocks
    }
    match = pattern.exec(html)
  }

  return results
}

/**
 * Detects the source site name from a recipe URL hostname.
 *
 * @param url - Recipe page URL
 * @returns Human-readable site name
 *
 * @example
 * detectSourceSite('https://www.seriouseats.com/recipes/...') // "Serious Eats"
 */
export function detectSourceSite(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')

    const sites: Record<string, string> = {
      'seriouseats.com': 'Serious Eats',
      'bbcgoodfood.com': 'BBC Good Food',
      'allrecipes.com': 'AllRecipes',
      'budgetbytes.com': 'Budget Bytes',
      'cookieandkate.com': 'Cookie and Kate',
      'kingarthurbaking.com': 'King Arthur Baking',
      'pinchofyum.com': 'Pinch of Yum',
      'recipetineats.com': 'RecipeTin Eats',
      'simplyrecipes.com': 'Simply Recipes',
      'gimmesomeoven.com': 'Gimme Some Oven',
      'foodnetwork.com': 'Food Network',
      'onceuponachef.com': 'Once Upon a Chef',
      'thepioneerwoman.com': 'The Pioneer Woman',
      'theseasonedmom.com': 'The Seasoned Mom',
      'food.com': 'Food.com',
    }

    return sites[hostname]
  } catch {
    return undefined
  }
}

/**
 * Pulls a page URL from a Recipe JSON-LD node when the user did not supply one.
 *
 * @param recipeNode - Parsed Recipe object from JSON-LD
 * @returns HTTP(S) URL if present on the node
 */
function extractUrlFromRecipeNode(recipeNode: JsonLdNode): string | undefined {
  const candidates = [recipeNode.url, recipeNode['@id'], recipeNode.mainEntityOfPage]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
      return candidate
    }
    if (candidate && typeof candidate === 'object' && '@id' in candidate) {
      const id = String((candidate as JsonLdNode)['@id'])
      if (/^https?:\/\//i.test(id)) return id
    }
  }

  return undefined
}

/**
 * Converts a schema.org Recipe JSON-LD node to an import draft.
 *
 * @param recipeNode - Parsed Recipe object from JSON-LD
 * @param sourceUrl - Optional original page URL
 * @returns Import draft ready for user review
 */
export function mapJsonLdToRecipeDraft(
  recipeNode: JsonLdNode,
  sourceUrl?: string,
): ImportedRecipeDraft {
  const image = recipeNode.image
  let imageUrl: string | undefined

  if (typeof image === 'string') {
    imageUrl = image
  } else if (Array.isArray(image) && typeof image[0] === 'string') {
    imageUrl = image[0]
  } else if (image && typeof image === 'object' && 'url' in image) {
    imageUrl = String((image as JsonLdNode).url)
  }

  const nutritionNode =
    recipeNode.nutrition && typeof recipeNode.nutrition === 'object'
      ? (recipeNode.nutrition as JsonLdNode)
      : undefined

  const resolvedUrl = sourceUrl?.trim() || extractUrlFromRecipeNode(recipeNode)

  return {
    name: String(recipeNode.name ?? 'Imported recipe'),
    description:
      typeof recipeNode.description === 'string'
        ? recipeNode.description
        : undefined,
    imageUrl,
    sourceUrl: resolvedUrl,
    sourceSite: resolvedUrl ? detectSourceSite(resolvedUrl) : undefined,
    servings: parseServings(recipeNode.recipeYield),
    prepTimeMinutes: parseDurationToMinutes(recipeNode.prepTime),
    cookTimeMinutes: parseDurationToMinutes(recipeNode.cookTime),
    ingredients: parseIngredients(recipeNode.recipeIngredient),
    instructions: parseInstructions(recipeNode.recipeInstructions),
    nutrition: parseSchemaNutrition(nutritionNode),
    tags: suggestRecipeTags(recipeNode.recipeCategory, recipeNode.keywords),
  }
}

/**
 * Parses recipe data from a full HTML page string.
 *
 * @param html - HTML document content
 * @param sourceUrl - Original recipe URL
 * @returns Import draft or null if no recipe found
 *
 * @example
 * const draft = parseRecipeFromHtml(html, 'https://www.seriouseats.com/...')
 */
export function parseRecipeFromHtml(
  html: string,
  sourceUrl: string,
): ImportedRecipeDraft | null {
  const jsonLdBlocks = extractJsonLdFromHtml(html)

  for (const block of jsonLdBlocks) {
    const recipeNode = findRecipeInJsonLd(block)
    if (recipeNode) {
      return mapJsonLdToRecipeDraft(recipeNode, sourceUrl)
    }
  }

  return null
}

/**
 * Parses a manually pasted JSON-LD blob (or a full `<script type="application/ld+json">` tag).
 *
 * @param raw - Pasted JSON, script tag, or HTML snippet containing JSON-LD
 * @param sourceUrl - Optional page URL for source attribution and duplicate checks
 * @returns Import draft or null if no Recipe node found
 *
 * @example
 * parseRecipeFromJsonLdPaste('{"@type":"Recipe","name":"Granola",...}', 'https://...')
 */
export function parseRecipeFromJsonLdPaste(
  raw: string,
  sourceUrl?: string,
): ImportedRecipeDraft | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const blocks: unknown[] = []

  if (/application\/ld\+json/i.test(trimmed) || /<script[\s>]/i.test(trimmed)) {
    const html = /<script[\s>]/i.test(trimmed)
      ? trimmed
      : `<script type="application/ld+json">${trimmed}</script>`
    blocks.push(...extractJsonLdFromHtml(html))
  }

  if (blocks.length === 0) {
    try {
      blocks.push(JSON.parse(trimmed))
    } catch {
      const start = trimmed.indexOf('{')
      const end = trimmed.lastIndexOf('}')
      if (start < 0 || end <= start) return null
      try {
        blocks.push(JSON.parse(trimmed.slice(start, end + 1)))
      } catch {
        return null
      }
    }
  }

  for (const block of blocks) {
    const recipeNode = findRecipeInJsonLd(block)
    if (recipeNode) {
      return mapJsonLdToRecipeDraft(recipeNode, sourceUrl)
    }
  }

  return null
}
