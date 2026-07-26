import type { MealPlan } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'
import type {
  ShoppingCategory,
  ShoppingListGroup,
  ShoppingListItem,
} from '#/types/shopping-list'
import { decodeHtmlEntities } from '#/lib/html-entities'

/** Display order and labels for grocery categories */
export const SHOPPING_CATEGORY_META: {
  category: ShoppingCategory
  label: string
}[] = [
  { category: 'produce', label: 'Produce' },
  { category: 'meat_fish', label: 'Meat & fish' },
  { category: 'dairy_eggs', label: 'Dairy & eggs' },
  { category: 'bakery', label: 'Bakery' },
  { category: 'pantry', label: 'Pantry' },
  { category: 'spices', label: 'Spices & seasonings' },
  { category: 'frozen', label: 'Frozen' },
  { category: 'other', label: 'Other' },
]

/**
 * Measurement tokens that belong with the quantity, not the product name.
 * "4 tbsp olive oil" → qty 4, unit tbsp, name olive oil — not "4 olive oils".
 */
const MEASUREMENT_UNITS = [
  'tablespoons?',
  'tbsp\\.?',
  'tbs\\.?',
  'teaspoons?',
  'tsp\\.?',
  'cups?',
  'millilitres?',
  'milliliters?',
  'ml\\.?',
  'litres?',
  'liters?',
  'l\\.?',
  'kilograms?',
  'kg\\.?',
  'grams?',
  'g\\.?',
  'pounds?',
  'lbs?\\.?',
  'ounces?',
  'oz\\.?',
  'fluid\\s+ounces?',
  'fl\\.?\\s*oz\\.?',
  'pinches?',
  'dashes?',
  'handfuls?',
  'cloves?',
  'cans?',
  'tins?',
  'jars?',
  'packs?',
  'packets?',
  'bunches?',
  'slices?',
  'pieces?',
  'sticks?',
  'heads?',
  'sprigs?',
] as const

const UNIT_PATTERN = MEASUREMENT_UNITS.join('|')

/** Leading quantity: 2, 1/2, 1½, 1 1/2, 2.5 */
const QTY_PATTERN =
  '(?<qty>(?:\\d+\\s+)?\\d+\\s*\\/\\s*\\d+|\\d+[\\u00bc-\\u00be\\u2150-\\u215e]?|(?:\\d+)?[\\u00bc-\\u00be\\u2150-\\u215e]|\\d+(?:\\.\\d+)?)'

const INGREDIENT_WITH_UNIT = new RegExp(
  `^${QTY_PATTERN}\\s*(?<unit>${UNIT_PATTERN})\\b(?:\\s+of)?\\s+(?<name>.+)$`,
  'i',
)

const INGREDIENT_COUNT_ONLY = new RegExp(
  `^${QTY_PATTERN}\\s+(?<name>.+)$`,
  'i',
)

const PREP_WORDS =
  /\b(fresh|large|medium|small|chopped|diced|minced|sliced|crushed|grated|ground|dried|frozen|organic|whole|boneless|skinless|raw|cooked|extra.?virgin)\b/gi

/** Keyword → category heuristics for aisle grouping */
const CATEGORY_KEYWORDS: { category: ShoppingCategory; words: string[] }[] = [
  {
    category: 'dairy_eggs',
    words: [
      'milk',
      'cream',
      'butter',
      'cheese',
      'yogurt',
      'yoghurt',
      'egg',
      'eggs',
      'sour cream',
      'crème',
      'creme',
      'mozzarella',
      'parmesan',
      'cheddar',
      'ricotta',
      'feta',
      'cottage cheese',
      'buttermilk',
      'ghee',
    ],
  },
  {
    category: 'meat_fish',
    words: [
      'chicken',
      'beef',
      'pork',
      'lamb',
      'turkey',
      'bacon',
      'sausage',
      'ham',
      'steak',
      'mince',
      'ground beef',
      'fish',
      'salmon',
      'tuna',
      'cod',
      'prawn',
      'shrimp',
      'seafood',
      'duck',
      'chorizo',
      'prosciutto',
      'salami',
    ],
  },
  {
    category: 'spices',
    words: [
      'salt',
      'black pepper',
      'white pepper',
      'ground pepper',
      'paprika',
      'cumin',
      'cinnamon',
      'oregano',
      'thyme',
      'rosemary',
      'spice',
      'seasoning',
      'chili powder',
      'chilli powder',
      'curry powder',
      'turmeric',
      'nutmeg',
      'cayenne',
      'garlic powder',
      'onion powder',
      'bay leaf',
      'bay leaves',
      'vanilla extract',
    ],
  },
  {
    category: 'produce',
    words: [
      'onion',
      'garlic',
      'tomato',
      'potato',
      'carrot',
      'celery',
      'bell pepper',
      'red pepper',
      'green pepper',
      'lettuce',
      'spinach',
      'kale',
      'broccoli',
      'cauliflower',
      'courgette',
      'zucchini',
      'cucumber',
      'lemon',
      'lime',
      'orange',
      'apple',
      'banana',
      'berry',
      'berries',
      'avocado',
      'mushroom',
      'ginger',
      'parsley',
      'coriander',
      'cilantro',
      'basil',
      'mint',
      'rocket',
      'arugula',
      'cabbage',
      'salad',
      'spring onion',
      'scallion',
      'shallot',
      'chilli',
      'chili',
      'jalapeño',
      'jalapeno',
    ],
  },
  {
    category: 'bakery',
    words: [
      'bread',
      'bun',
      'roll',
      'tortilla',
      'wrap',
      'pita',
      'bagel',
      'croissant',
      'pastry',
    ],
  },
  {
    category: 'frozen',
    words: ['frozen', 'ice cream'],
  },
  {
    category: 'pantry',
    words: [
      'olive oil',
      'vegetable oil',
      'oil',
      'flour',
      'sugar',
      'rice',
      'pasta',
      'noodle',
      'beans',
      'lentil',
      'chickpea',
      'stock',
      'broth',
      'sauce',
      'soy sauce',
      'vinegar',
      'honey',
      'maple',
      'mustard',
      'ketchup',
      'mayo',
      'mayonnaise',
      'peanut butter',
      'jam',
      'oat',
      'oats',
      'cereal',
      'quinoa',
      'couscous',
      'breadcrumbs',
      'coconut milk',
      'tomato paste',
      'passata',
      'canned',
      'baking powder',
      'baking soda',
      'yeast',
      'cornstarch',
      'cornflour',
      'pepper',
    ],
  },
]

type ParsedIngredient = {
  name: string
  quantity?: number
  unit?: string
}

type MutableLine = {
  name: string
  displayName: string
  quantity?: number
  unit?: string
  category: ShoppingCategory
  recipeCount: number
}

/**
 * Parses a unicode or ascii fraction / mixed number into a float.
 *
 * @param raw - Quantity token such as "2", "1/2", "1½", or "1 1/2"
 * @returns Numeric value, or undefined if unparseable
 *
 * @example
 * parseQuantityToken('1½') // 1.5
 * parseQuantityToken('1 1/2') // 1.5
 */
function parseQuantityToken(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  if (!cleaned) return undefined

  const vulgar: Record<string, number> = {
    '¼': 0.25,
    '½': 0.5,
    '¾': 0.75,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅕': 0.2,
    '⅖': 0.4,
    '⅗': 0.6,
    '⅘': 0.8,
    '⅙': 1 / 6,
    '⅚': 5 / 6,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875,
  }

  for (const [glyph, value] of Object.entries(vulgar)) {
    if (cleaned.includes(glyph)) {
      const whole = cleaned.replace(glyph, '').trim()
      const wholeNum = whole ? Number(whole) : 0
      if (Number.isFinite(wholeNum)) return wholeNum + value
    }
  }

  const mixed = cleaned.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  }

  const fraction = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2])
  }

  const decimal = Number(cleaned)
  return Number.isFinite(decimal) ? decimal : undefined
}

/**
 * Normalises a measurement unit to a short canonical form for merging.
 *
 * @param unit - Raw unit from the ingredient line
 * @returns Canonical unit key (e.g. tbsp, tsp, cup)
 *
 * @example
 * normaliseUnit('Tablespoons') // 'tbsp'
 */
function normaliseUnit(unit: string): string {
  const u = unit.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()

  if (/^(tablespoons?|tbsp|tbs)$/.test(u)) return 'tbsp'
  if (/^(teaspoons?|tsp)$/.test(u)) return 'tsp'
  if (/^cups?$/.test(u)) return 'cup'
  if (/^(millilitres?|milliliters?|ml)$/.test(u)) return 'ml'
  if (/^(litres?|liters?|l)$/.test(u)) return 'l'
  if (/^(kilograms?|kg)$/.test(u)) return 'kg'
  if (/^(grams?|g)$/.test(u)) return 'g'
  if (/^(pounds?|lbs?)$/.test(u)) return 'lb'
  if (/^(ounces?|oz)$/.test(u)) return 'oz'
  if (/^(fluid ounces?|fl oz)$/.test(u)) return 'fl oz'
  if (/^pinches?$/.test(u)) return 'pinch'
  if (/^dashes?$/.test(u)) return 'dash'
  if (/^handfuls?$/.test(u)) return 'handful'
  if (/^cloves?$/.test(u)) return 'clove'
  if (/^cans?$/.test(u)) return 'can'
  if (/^tins?$/.test(u)) return 'tin'
  if (/^jars?$/.test(u)) return 'jar'
  if (/^packs?$/.test(u)) return 'pack'
  if (/^packets?$/.test(u)) return 'packet'
  if (/^bunches?$/.test(u)) return 'bunch'
  if (/^slices?$/.test(u)) return 'slice'
  if (/^pieces?$/.test(u)) return 'piece'
  if (/^sticks?$/.test(u)) return 'stick'
  if (/^heads?$/.test(u)) return 'head'
  if (/^sprigs?$/.test(u)) return 'sprig'

  return u
}

/**
 * Cleans ingredient name text for display and merge keys.
 *
 * @param name - Product portion of the ingredient line
 * @returns Trimmed name without trailing notes in parentheses
 *
 * @example
 * cleanIngredientName('olive oil (extra virgin)') // 'olive oil'
 */
function cleanIngredientName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/,.*$/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds a merge key that ignores prep adjectives so "large eggs" and "eggs" combine.
 *
 * @param name - Display name
 * @returns Lowercased key used for deduplication
 *
 * @example
 * mergeKey('Large Eggs') // 'eggs'
 */
function mergeKey(name: string): string {
  return cleanIngredientName(name)
    .toLowerCase()
    .replace(PREP_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses a free-text recipe ingredient into quantity, optional unit, and name.
 * Measurement units stay with the quantity so "4 tbsp olive oil" is oil measured
 * in tablespoons — not four bottles of oil.
 *
 * @param text - Raw ingredient line from a recipe
 * @returns Parsed parts ready to scale and merge
 *
 * @example
 * parseIngredientText('4 tbsp olive oil')
 * // { quantity: 4, unit: 'tbsp', name: 'olive oil' }
 *
 * parseIngredientText('2 large eggs')
 * // { quantity: 2, name: 'large eggs' }
 *
 * parseIngredientText('salt')
 * // { name: 'salt' }
 */
export function parseIngredientText(text: string): ParsedIngredient {
  const trimmed = decodeHtmlEntities(text.trim().replace(/\s+/g, ' '))
  if (!trimmed) return { name: '' }

  const withUnit = trimmed.match(INGREDIENT_WITH_UNIT)
  if (withUnit?.groups) {
    const quantity = parseQuantityToken(withUnit.groups.qty ?? '')
    const unit = normaliseUnit(withUnit.groups.unit ?? '')
    const name = cleanIngredientName(withUnit.groups.name ?? '')
    if (name) {
      return {
        name,
        ...(quantity != null ? { quantity } : {}),
        ...(unit ? { unit } : {}),
      }
    }
  }

  const countOnly = trimmed.match(INGREDIENT_COUNT_ONLY)
  if (countOnly?.groups) {
    const quantity = parseQuantityToken(countOnly.groups.qty ?? '')
    const name = cleanIngredientName(countOnly.groups.name ?? '')
    if (name) {
      return {
        name,
        ...(quantity != null ? { quantity } : {}),
      }
    }
  }

  return { name: cleanIngredientName(trimmed) || trimmed }
}

/**
 * Assigns a grocery aisle category from ingredient name keywords.
 *
 * @param name - Cleaned product name
 * @returns Shopping category for grouping
 *
 * @example
 * categoriseIngredient('olive oil') // 'pantry'
 * categoriseIngredient('cheddar cheese') // 'dairy_eggs'
 */
export function categoriseIngredient(name: string): ShoppingCategory {
  const lower = name.toLowerCase()
  let best: { category: ShoppingCategory; length: number } | undefined

  for (const { category, words } of CATEGORY_KEYWORDS) {
    for (const word of words) {
      const pattern = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i',
      )
      if (!pattern.test(lower)) continue
      if (!best || word.length > best.length) {
        best = { category, length: word.length }
      }
    }
  }

  return best?.category ?? 'other'
}

/**
 * Formats a quantity for display, trimming noisy decimals.
 *
 * @param quantity - Numeric total
 * @returns Short display string
 *
 * @example
 * formatQuantity(4) // '4'
 * formatQuantity(1.5) // '1.5'
 * formatQuantity(2.333333) // '2.33'
 */
export function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity)
  const rounded = Math.round(quantity * 100) / 100
  return String(rounded)
}

/**
 * Kitchen measures that are recipe instructions, not shoppable amounts.
 * "4 tbsp olive oil" → shopper just needs olive oil in the cupboard.
 */
const KITCHEN_MEASURE_UNITS = new Set([
  'tbsp',
  'tsp',
  'cup',
  'pinch',
  'dash',
  'handful',
  'sprig',
  'fl oz',
])

/**
 * Whether a unit is a cooking measure rather than a buyable pack/weight.
 *
 * @param unit - Canonical unit from `normaliseUnit`
 * @returns True for tbsp/cup/tsp-style measures
 *
 * @example
 * isKitchenMeasure('tbsp') // true
 * isKitchenMeasure('g') // false
 */
export function isKitchenMeasure(unit: string): boolean {
  return KITCHEN_MEASURE_UNITS.has(unit)
}

/**
 * Drops recipe kitchen measures so the list only checks that the item is needed.
 * Keeps buyable amounts (g, ml, cans) and plain counts (eggs).
 *
 * @param parsed - Parsed ingredient after text parse
 * @returns Presence-only line for kitchen measures; otherwise unchanged
 *
 * @example
 * toShoppingAmount({ name: 'olive oil', quantity: 4, unit: 'tbsp' })
 * // { name: 'olive oil' }
 *
 * toShoppingAmount({ name: 'chicken', quantity: 400, unit: 'g' })
 * // { name: 'chicken', quantity: 400, unit: 'g' }
 */
export function toShoppingAmount(parsed: ParsedIngredient): ParsedIngredient {
  if (parsed.unit && isKitchenMeasure(parsed.unit)) {
    return { name: parsed.name }
  }
  return parsed
}

/**
 * Builds the visible label for one shopping line.
 *
 * @param item - Aggregated shopping-list item
 * @returns Label such as "olive oil", "400 g chicken", or "4 eggs"
 *
 * @example
 * formatShoppingLine({ name: 'olive oil' }) // 'olive oil'
 * formatShoppingLine({ name: 'eggs', quantity: 4 }) // '4 eggs'
 */
export function formatShoppingLine(
  item: Pick<ShoppingListItem, 'name' | 'quantity' | 'unit'>,
): string {
  if (item.quantity == null) return item.name
  if (item.unit) {
    return `${formatQuantity(item.quantity)} ${item.unit} ${item.name}`
  }
  return `${formatQuantity(item.quantity)} ${item.name}`
}

/**
 * Scales a parsed ingredient by how many recipe servings were added to the plan.
 * Presence-only kitchen-measure items are left unchanged.
 *
 * @param parsed - Parsed ingredient line (after `toShoppingAmount`)
 * @param scale - planServings / recipe.servings
 * @returns Scaled quantity (unit and name unchanged)
 *
 * @example
 * scaleParsedIngredient({ name: 'chicken', quantity: 400, unit: 'g' }, 0.5)
 * // { name: 'chicken', quantity: 200, unit: 'g' }
 */
function scaleParsedIngredient(
  parsed: ParsedIngredient,
  scale: number,
): ParsedIngredient {
  if (parsed.quantity == null || scale === 1) return parsed
  return {
    ...parsed,
    quantity: parsed.quantity * scale,
  }
}

/**
 * Generates a shopping list from a meal plan by collecting recipe ingredients,
 * scaling them to planned servings, merging duplicates, and grouping by aisle.
 *
 * Non-recipe food entries (manual / Open Food Facts) are listed as single products
 * under Other when they appear in the plan.
 *
 * @param plan - Meal plan to scan
 * @param recipes - Recipe library used to resolve `recipeId` references
 * @returns Category groups with merged items (empty groups omitted)
 *
 * @example
 * buildShoppingList(plan, recipes)
 * // [{ category: 'dairy_eggs', label: 'Dairy & eggs', items: [...] }, ...]
 */
export function buildShoppingList(
  plan: MealPlan,
  recipes: Recipe[],
): ShoppingListGroup[] {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const lines = new Map<string, MutableLine>()

  /**
   * Merges one ingredient contribution into the running list.
   *
   * @param parsed - Scaled parsed ingredient
   * @param category - Override category when known (e.g. packaged foods)
   */
  function addLine(parsed: ParsedIngredient, category?: ShoppingCategory) {
    const name = parsed.name.trim()
    if (!name) return

    const unit = parsed.unit
    // Presence-only lines (no qty) merge by name so tbsp/cup oil collapse together
    const key =
      parsed.quantity == null
        ? `${mergeKey(name)}::need`
        : `${mergeKey(name)}::${unit ?? 'count'}`
    const existing = lines.get(key)
    const resolvedCategory = category ?? categoriseIngredient(name)

    if (!existing) {
      lines.set(key, {
        name: mergeKey(name) || name.toLowerCase(),
        displayName: name,
        quantity: parsed.quantity,
        unit,
        category: resolvedCategory,
        recipeCount: 1,
      })
      return
    }

    existing.recipeCount += 1
    if (parsed.quantity != null) {
      existing.quantity = (existing.quantity ?? 0) + parsed.quantity
    }
    // Prefer the shorter / simpler display name when merging variants
    if (name.length < existing.displayName.length) {
      existing.displayName = name
    }
  }

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        if (item.source === 'recipe' && item.recipeId) {
          const recipe = recipeById.get(item.recipeId)
          if (!recipe) continue

          const plannedServings = item.recipeServings ?? 1
          const baseServings = recipe.servings > 0 ? recipe.servings : 1
          const scale = plannedServings / baseServings

          for (const ingredient of recipe.ingredients) {
            const forShopping = toShoppingAmount(
              parseIngredientText(ingredient.text),
            )
            const parsed = scaleParsedIngredient(forShopping, scale)
            addLine(parsed)
          }
          continue
        }

        // Manual / barcode items: list the product once (grams kept for OFF weights)
        if (item.source === 'openfoodfacts' && item.unit === 'g') {
          addLine(
            { name: item.name, quantity: item.quantity, unit: 'g' },
            'other',
          )
        } else {
          addLine({ name: item.name }, 'other')
        }
      }
    }
  }

  const items: ShoppingListItem[] = [...lines.values()].map((line, index) => ({
    id: `${line.name}-${line.unit ?? 'count'}-${index}`,
    name: line.displayName,
    ...(line.quantity != null ? { quantity: line.quantity } : {}),
    ...(line.unit ? { unit: line.unit } : {}),
    category: line.category,
    recipeCount: line.recipeCount,
  }))

  return SHOPPING_CATEGORY_META.map(({ category, label }) => ({
    category,
    label,
    items: items
      .filter((item) => item.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0)
}
