/**
 * Controlled meal-type tags for recipes.
 *
 * Kept as a fixed list so create/import UI and plan filters stay consistent.
 */
export const RECIPE_TAGS = [
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'snack',
] as const

export type RecipeTag = (typeof RECIPE_TAGS)[number]

/** Display labels for controlled recipe tags */
export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  snack: 'Snack',
}

/** Alias phrases from schema.org category/keywords → controlled tags */
const TAG_ALIASES: Record<RecipeTag, string[]> = {
  breakfast: ['breakfast', 'brunch', 'morning meal'],
  lunch: ['lunch', 'midday'],
  dinner: ['dinner', 'supper', 'main course', 'main dish', 'entree', 'entrée'],
  dessert: ['dessert', 'desserts', 'pudding'],
  snack: ['snack', 'snacks', 'appetizer', 'starter', 'side dish'],
}

/**
 * Type guard for controlled recipe tags.
 *
 * @param value - Candidate tag string e.g. `"breakfast"`
 * @returns Whether the value is a known RecipeTag
 *
 * @example
 * isRecipeTag('breakfast') // true
 * isRecipeTag('vegan') // false
 */
export function isRecipeTag(value: string): value is RecipeTag {
  return (RECIPE_TAGS as readonly string[]).includes(value)
}

/**
 * Dedupes and keeps only controlled recipe tags, preserving list order.
 *
 * @param tags - Candidate tags (may include unknowns or duplicates)
 * @returns Valid unique RecipeTag values
 *
 * @example
 * normalizeRecipeTags(['Dinner', 'dinner', 'vegan']) // ['dinner']
 */
export function normalizeRecipeTags(tags: readonly string[]): RecipeTag[] {
  const seen = new Set<RecipeTag>()
  const result: RecipeTag[] = []

  for (const raw of tags) {
    const normalized = raw.trim().toLowerCase()
    if (!isRecipeTag(normalized) || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

/**
 * Collects free-text phrases from schema.org category / keyword fields.
 *
 * @param value - recipeCategory, keywords, or similar JSON-LD field
 * @returns Flattened lowercase phrases
 *
 * @example
 * collectSchemaPhrases(['Breakfast', 'Dessert']) // ['breakfast', 'dessert']
 */
function collectSchemaPhrases(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/[,;/|]+/)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSchemaPhrases(item))
  }

  return []
}

/**
 * Checks whether a phrase contains an alias as a whole word/phrase.
 *
 * @param phrase - Lowercased category/keyword fragment e.g. `"main course"`
 * @param alias - Alias to match e.g. `"main course"`
 * @returns True when the alias appears as a whole phrase
 *
 * @example
 * phraseIncludesAlias('sunday dinner', 'dinner') // true
 * phraseIncludesAlias('pancake', 'cake') // false
 */
function phraseIncludesAlias(phrase: string, alias: string): boolean {
  if (phrase === alias) return true

  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`)
  return pattern.test(phrase)
}

/**
 * Maps a free-text phrase to a controlled recipe tag when it matches an alias.
 *
 * @param phrase - Lowercased category/keyword fragment e.g. `"main course"`
 * @returns Matching RecipeTag or undefined
 *
 * @example
 * matchPhraseToTag('main course') // 'dinner'
 */
function matchPhraseToTag(phrase: string): RecipeTag | undefined {
  const normalized = phrase.trim().toLowerCase()
  if (!normalized) return undefined

  if (isRecipeTag(normalized)) return normalized

  for (const tag of RECIPE_TAGS) {
    if (TAG_ALIASES[tag].some((alias) => phraseIncludesAlias(normalized, alias))) {
      return tag
    }
  }

  return undefined
}

/**
 * Suggests controlled tags from schema.org recipeCategory and keywords.
 *
 * @param recipeCategory - schema.org recipeCategory field
 * @param keywords - schema.org keywords field
 * @returns Deduped controlled tags for the import preview
 *
 * @example
 * suggestRecipeTags('Breakfast', 'quick, brunch') // ['breakfast']
 */
export function suggestRecipeTags(
  recipeCategory: unknown,
  keywords: unknown,
): RecipeTag[] {
  const phrases = [
    ...collectSchemaPhrases(recipeCategory),
    ...collectSchemaPhrases(keywords),
  ]

  const suggested: RecipeTag[] = []
  const seen = new Set<RecipeTag>()

  for (const phrase of phrases) {
    const tag = matchPhraseToTag(phrase)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    suggested.push(tag)
  }

  return suggested
}

/**
 * Toggles a tag in a controlled list (add if missing, remove if present).
 *
 * @param tags - Current selected tags
 * @param tag - Tag to toggle e.g. `"lunch"`
 * @returns Updated tag list
 *
 * @example
 * toggleRecipeTag(['breakfast'], 'lunch') // ['breakfast', 'lunch']
 */
export function toggleRecipeTag(tags: readonly RecipeTag[], tag: RecipeTag): RecipeTag[] {
  if (tags.includes(tag)) {
    return tags.filter((item) => item !== tag)
  }
  return [...tags, tag]
}
