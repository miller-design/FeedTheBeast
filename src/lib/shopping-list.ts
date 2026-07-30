import { decodeHtmlEntities } from '#/lib/html-entities'
import type { MealPlan } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'
import type {
  ShoppingCategory,
  ShoppingListGroup,
  ShoppingListItem,
} from '#/types/shopping-list'

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
  { category: 'other', label: 'Uncategorised' },
]

/**
 * Measurement tokens that belong with the quantity, not the product name.
 * "4 tbsp olive oil" → qty 4, unit tbsp, name olive oil — not "4 olive oils".
 */
/**
 * Unit tokens for parsing. Single-letter `g` / `l` use a negative lookahead so
 * they never steal the first letter of "garlic", "limes", etc.
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
  'l(?![a-z])',
  'kilograms?',
  'kg\\.?',
  'grams?',
  'g(?![a-z])',
  'pounds?',
  'lbs?\\.?',
  'ounces?',
  'oz\\.?',
  'fluid\\s+ounces?',
  'fl\\.?\\s*oz\\.?',
  'floz',
  'pinches?',
  'dashes?',
  'handfuls?',
  'cloves?',
  'stalks?',
  'cans?',
  'tins?',
  'jars?',
  'packs?',
  'packets?',
  'packages?',
  'bunches?',
  'slices?',
  'pieces?',
  'sticks?',
  'heads?',
  'sprigs?',
] as const

const UNIT_PATTERN = MEASUREMENT_UNITS.join('|')

/** Leading quantity: 2, 1/2, 1½, 1 1/2, 2.5, or ranges 2-3 / 6–8 */
const QTY_PATTERN =
  '(?<qty>(?:\\d+\\s+)?\\d+\\s*\\/\\s*\\d+|\\d+[\\u00bc-\\u00be\\u2150-\\u215e]?|(?:\\d+)?[\\u00bc-\\u00be\\u2150-\\u215e]|\\d+(?:\\.\\d+)?(?:\\s*[–—-]\\s*(?:\\d+\\s*\\/\\s*\\d+|\\d+(?:\\.\\d+)?))?)'

const INGREDIENT_WITH_UNIT = new RegExp(
  `^${QTY_PATTERN}\\s*(?<unit>${UNIT_PATTERN})\\b(?:\\s+of)?\\s+(?<name>.+)$`,
  'i',
)

const INGREDIENT_COUNT_ONLY = new RegExp(
  `^${QTY_PATTERN}\\s+(?<name>.+)$`,
  'i',
)

const PREP_WORDS =
  /\b(fresh|freshly|large|medium|small|chopped|diced|minced|sliced|crushed|grated|shredded|ground|dried|frozen|organic|whole|bone-?in|boneless|skin-?on|skinless|raw|cooked|extra.?virgin|finely|roughly|thinly|melted|refrigerated|pre-?cooked|fat-?free|full-?fat|plain|natural|toasted|smoked|roasted|old-?fashioned|rolled|granulated|semisweet|unsweetened|low-?calorie|stabilized|traditional|all-?purpose|curly|free-?range)\b/gi

const USE_PHRASES =
  /\b(to taste|as needed|optional|for frying|for cooking|for serving|for garnish|for dipping|or more|plus more)\b/gi

/** Lone adjectives left after parsing — not real shopping items */
const ORPHAN_DESCRIPTORS = new Set([
  'natural',
  'toasted',
  'smoked',
  'roasted',
  'fresh',
  'freshly',
  'large',
  'medium',
  'small',
  'plain',
  'organic',
  'dried',
  'frozen',
  'melted',
  'chopped',
  'diced',
  'minced',
  'sliced',
  'grated',
  'shredded',
  'ground',
  'cooked',
  'raw',
  'whole',
  'fine',
  'finely',
])

const NON_SHOPPABLE_PATTERN =
  /^(water|tap water|hot water|cold water|boiling water|warm water|iced? water|ice|cooking spray|low-calorie cooking spray|herbs|meatless alternative|lingonberry|blueberry)$/i

/** Always presence-only on the list (buy the item, ignore recipe amounts). */
const PRESENCE_ONLY_NAMES = new Set([
  'olive oil',
  'vegetable oil',
  'avocado oil',
  'butter',
  'salt',
  'black pepper',
  'red pepper flakes',
  'garlic',
  'garlic powder',
  'onion powder',
  'ginger',
  'soy sauce',
  'honey',
  'brown sugar',
  'sugar',
  'flour',
  'vanilla extract',
  'almond extract',
  'oregano',
  'italian seasoning',
  'taco seasoning',
  'chicken seasoning',
  'bay leaf',
  'fennel seeds',
  'garam masala',
  'curry paste',
  'chilli powder',
  'chili crisp',
  'canned tomatoes',
  'tomato sauce',
  'gochujang sauce',
  'satay sauce',
  'teriyaki sauce',
  'sesame seeds',
  'kimchi',
  'chicken stock',
  'vegetable stock',
  'kale',
  'spinach',
  'cilantro',
  'parsley',
])

/**
 * Kitchen measures that are recipe instructions, not shoppable amounts.
 * Clove/stalk counts of aromatics also become presence checks.
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
  'clove',
  'stalk',
  'ml',
  'l',
])

/** Package / count units that should round up to a whole number for shopping. */
const CEIL_UNITS = new Set([
  'can',
  'tin',
  'jar',
  'pack',
  'packet',
  'package',
  'bunch',
  'piece',
  'slice',
  'stick',
  'head',
])

/** Keyword → category heuristics (longer phrases win). */
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
      'mozzarella',
      'parmesan',
      'cheddar',
      'ricotta',
      'feta',
      'cottage cheese',
      'buttermilk',
      'ghee',
      'tortellini',
      'cheese tortellini',
      'whipped cream',
    ],
  },
  {
    category: 'meat_fish',
    words: [
      'chicken thigh',
      'chicken breast',
      'chicken thighs',
      'chicken breasts',
      'ground beef',
      'italian sausage',
      'sausage',
      'chicken',
      'beef',
      'pork',
      'lamb',
      'turkey',
      'bacon',
      'ham',
      'steak',
      'mince',
      'fish',
      'salmon',
      'tuna',
      'cod',
      'prawn',
      'shrimp',
      'seafood',
      'duck',
      'chorizo',
    ],
  },
  {
    category: 'spices',
    words: [
      'salt',
      'black pepper',
      'white pepper',
      'red pepper flakes',
      'pepper flakes',
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
      'hot chilli powder',
      'curry powder',
      'curry paste',
      'yellow curry paste',
      'turmeric',
      'nutmeg',
      'cayenne',
      'garlic powder',
      'onion powder',
      'bay leaf',
      'bay leaves',
      'bay',
      'vanilla extract',
      'almond extract',
      'fennel seeds',
      'garam masala',
      'taco seasoning',
      'italian seasoning',
      'chicken seasoning',
      'chili crisp',
      'sesame seeds',
    ],
  },
  {
    category: 'produce',
    words: [
      'green onion',
      'green onions',
      'spring onion',
      'spring onions',
      'scallion',
      'scallions',
      'onion',
      'onions',
      'garlic',
      'tomato',
      'tomatoes',
      'potato',
      'potatoes',
      'carrot',
      'carrots',
      'celery',
      'bell pepper',
      'lettuce',
      'spinach',
      'baby spinach',
      'kale',
      'broccoli',
      'cauliflower',
      'courgette',
      'zucchini',
      'cucumber',
      'lemon',
      'lemons',
      'lime',
      'limes',
      'orange',
      'apple',
      'banana',
      'cherry',
      'cherries',
      'berry',
      'berries',
      'avocado',
      'shiitake mushrooms',
      'shiitake',
      'mushrooms',
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
      'shallot',
      'shallots',
      'chilli',
      'chili',
      'jalapeño',
      'jalapeno',
      'greens',
    ],
  },
  {
    category: 'bakery',
    words: [
      'garlic bread',
      'bread',
      'seeded buns',
      'buns',
      'bun',
      'roll',
      'tortilla',
      'tortillas',
      'wrap',
      'pita',
      'bagel',
      'croissant',
      'pastry',
      'gnocchi',
    ],
  },
  {
    category: 'frozen',
    words: ['frozen', 'ice cream'],
  },
  {
    category: 'pantry',
    words: [
      'chicken broth',
      'chicken stock',
      'vegetable broth',
      'vegetable stock',
      'beef broth',
      'beef stock',
      'broth',
      'stock',
      'olive oil',
      'avocado oil',
      'vegetable oil',
      'oil',
      'flour',
      'sugar',
      'brown sugar',
      'rice',
      'pasta',
      'noodle',
      'lentil',
      'lentils',
      'beans',
      'black beans',
      'chickpea',
      'gochujang sauce',
      'gochujang',
      'satay sauce',
      'teriyaki sauce',
      'soy sauce',
      'sauce',
      'vinegar',
      'honey',
      'maple',
      'mustard',
      'ketchup',
      'mayo',
      'mayonnaise',
      'peanut butter',
      'jam',
      'kimchi',
      'oat',
      'oats',
      'cereal',
      'quinoa',
      'couscous',
      'panko',
      'breadcrumbs',
      'coconut milk',
      'tomato paste',
      'tomato sauce',
      'passata',
      'salsa',
      'baking powder',
      'baking soda',
      'yeast',
      'cornstarch',
      'cornflour',
      'cocoa',
      'chocolate chips',
      'almonds',
      'sunflower seeds',
      'wheat germ',
      'extract',
    ],
  },
]

/** Exact / pattern aliases → short shopping names */
const NAME_ALIASES: { pattern: RegExp; name: string }[] = [
  { pattern: /^(table|kosher|sea|fine|flaky|rock|iodized|coarse|pink|himalayan)\s+salt$/, name: 'salt' },
  { pattern: /^salt$/, name: 'salt' },
  { pattern: /^(red\s+)?pepper\s+flakes$/, name: 'red pepper flakes' },
  {
    pattern: /^(freshly\s+)?(ground\s+)?(black\s+|white\s+)?pepper$/,
    name: 'black pepper',
  },
  { pattern: /^(extra virgin\s+)?olive oil$/, name: 'olive oil' },
  {
    pattern: /^(vegetable|canola|rapeseed|sunflower)\s+oil$/,
    name: 'vegetable oil',
  },
  { pattern: /^avocado oil$/, name: 'avocado oil' },
  { pattern: /^oil$/, name: 'olive oil' },
  { pattern: /^melted butter$/, name: 'butter' },
  { pattern: /^butter$/, name: 'butter' },
  {
    pattern:
      /^(arge\s+)?(cloves?\s+(of\s+)?)?garlic$|^garlic\s+cloves?$|^arlic$/,
    name: 'garlic',
  },
  { pattern: /^(cilantro|coriander)(\s+leaves)?$/, name: 'cilantro' },
  { pattern: /^parsley(\s+leaves)?$/, name: 'parsley' },
  { pattern: /^bay(\s+leaves?)?$/, name: 'bay leaf' },
  { pattern: /^chicken\s+(broth|stock)$/, name: 'chicken stock' },
  { pattern: /^vegetable\s+(broth|stock)$/, name: 'vegetable stock' },
  { pattern: /^parmesan(\s+cheese)?$/, name: 'parmesan' },
  { pattern: /^(shredded\s+)?mozzarella(\s+cheese)?$/, name: 'mozzarella' },
  { pattern: /^(full-?fat\s+)?ricotta(\s+cheese)?$/, name: 'ricotta' },
  { pattern: /^(cheese\s+)?tortellini$/, name: 'cheese tortellini' },
  {
    pattern: /^(plain|fat-?free|natural|full-?fat)?\s*(yogurt|yoghurt)$/,
    name: 'yogurt',
  },
  { pattern: /^panko(\s+breadcrumbs?)?$/, name: 'panko' },
  { pattern: /^(traditional\s+)?breadcrumbs?$/, name: 'breadcrumbs' },
  { pattern: /^(old-?fashioned\s+)?(rolled\s+)?oats$/, name: 'oats' },
  { pattern: /^brown sugar$/, name: 'brown sugar' },
  { pattern: /^(granulated\s+)?sugar$/, name: 'sugar' },
  { pattern: /^(wholegrain\s+)?(long\s+grain\s+)?rice$/, name: 'rice' },
  { pattern: /^(green|spring)\s+onions?$|^scallions?$/, name: 'green onions' },
  { pattern: /^(yellow\s+)?onions?$/, name: 'onion' },
  { pattern: /^shallots?$/, name: 'shallot' },
  { pattern: /^carrots?$/, name: 'carrot' },
  { pattern: /^lemons?$/, name: 'lemon' },
  { pattern: /^limes?$|^imes$/, name: 'lime' },
  { pattern: /^(baby\s+)?spinach$/, name: 'spinach' },
  { pattern: /^(curly\s+)?kale(\s+salad)?$/, name: 'kale' },
  { pattern: /^garlic bread$/, name: 'garlic bread' },
  { pattern: /^(black\s+)?beans$/, name: 'black beans' },
  { pattern: /^(full-?fat\s+)?coconut milk$/, name: 'coconut milk' },
  { pattern: /^(jar of\s+)?tomato sauce$/, name: 'tomato sauce' },
  { pattern: /^tomato paste$/, name: 'tomato paste' },
  {
    pattern:
      /^((can|tin|jar)(\s+of)?\s+)?(san\s+marzano(\s+style)?\s+)?(canned\s+)?tomatoes$/,
    name: 'canned tomatoes',
  },
  { pattern: /^(your\s+favorite\s+)?salsa$/, name: 'salsa' },
  { pattern: /^(flour\s+)?tortillas?$/, name: 'flour tortillas' },
  {
    pattern: /^(?:bone-?in\s+)?chicken breasts?$/,
    name: 'chicken breast',
  },
  {
    pattern: /^(?:bone-?in\s+)?chicken thighs?$/,
    name: 'chicken thigh',
  },
  // Unspecified "chicken" is almost always breast on a shopping list
  { pattern: /^chicken$/, name: 'chicken breast' },
  { pattern: /^bacon$/, name: 'bacon' },
  { pattern: /^(seeded\s+)?buns?$/, name: 'buns' },
  { pattern: /^gochujang(\s+sauce)?$/, name: 'gochujang sauce' },
  { pattern: /^satay(\s+sauce)?$/, name: 'satay sauce' },
  { pattern: /^teriyaki(\s+sauce)?$/, name: 'teriyaki sauce' },
  { pattern: /^sesame seeds?$/, name: 'sesame seeds' },
  { pattern: /^kimchi$/, name: 'kimchi' },
  { pattern: /^(mixed\s+)?greens$/, name: 'greens' },
  { pattern: /^(shiitake\s+)?mushrooms?$/, name: 'mushrooms' },
  { pattern: /^italian sausage$/, name: 'italian sausage' },
  {
    pattern:
      /^(lingonberry|blueberry)(\s+or\s+(lingonberry|blueberry))?\s+jam$|^jam$/,
    name: 'jam',
  },
  { pattern: /^(yellow\s+)?curry paste$/, name: 'curry paste' },
  { pattern: /^unsweetened cocoa$|^cocoa$/, name: 'cocoa' },
  {
    pattern: /^semisweet chocolate chips$|^chocolate chips$/,
    name: 'chocolate chips',
  },
  { pattern: /^red split lentils$|^lentils?$/, name: 'lentils' },
  { pattern: /^(packages?\s+)?(pre-?\s*)?gnocchi$/, name: 'gnocchi' },
  { pattern: /^stabilized wheat germ$|^wheat germ$/, name: 'wheat germ' },
  {
    pattern: /^hot chilli powder$|^chilli powder$|^chili powder$/,
    name: 'chilli powder',
  },
  {
    pattern: /^all-?purpose chicken seasoning$|^chicken seasoning$/,
    name: 'chicken seasoning',
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
  /** Piece count when a meat line also has a weight total */
  pieceCount?: number
  category: ShoppingCategory
  recipeCount: number
}

/** Aisle groups where all amounts for one product merge onto a single line */
const MERGE_BY_NAME_CATEGORIES = new Set<ShoppingCategory>(['meat_fish'])

/** Units that render tight against the number (50g, 200ml) */
const TIGHT_DISPLAY_UNITS = new Set(['g', 'kg', 'ml', 'l'])

/**
 * Whether a unit represents a buyable weight/volume rather than a piece count.
 *
 * @param unit - Canonical unit from `normaliseUnit`
 * @returns True for g/kg/ml/l style amounts
 *
 * @example
 * isWeightOrVolumeUnit('g') // true
 * isWeightOrVolumeUnit('slice') // false
 */
function isWeightOrVolumeUnit(unit?: string): boolean {
  return unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l'
}

/**
 * Builds the map key used when merging shopping-list contributions.
 * Meat and fish merge on product name only so weights and piece counts combine.
 *
 * @param canonical - Normalised product name
 * @param quantity - Parsed/scaled amount, if any
 * @param unit - Canonical unit, if any
 * @param category - Grocery aisle category
 * @returns Stable merge key
 *
 * @example
 * mergeLineKey('chicken thighs', 500, 'g', 'meat_fish') // 'chicken thighs::meat'
 * mergeLineKey('lentils', 50, 'g', 'pantry') // 'lentils::g'
 */
function mergeLineKey(
  canonical: string,
  quantity: number | undefined,
  unit: string | undefined,
  category: ShoppingCategory,
): string {
  if (quantity == null) return `${canonical}::need`
  if (MERGE_BY_NAME_CATEGORIES.has(category)) return `${canonical}::meat`
  return `${canonical}::${unit ?? 'count'}`
}

/**
 * Adds a scaled amount onto an existing meat/fish line, combining weight with
 * piece counts when recipes mix "500g chicken thighs" and "4 chicken thighs".
 *
 * @param line - Existing aggregated line (mutated in place)
 * @param quantity - Incoming scaled amount
 * @param unit - Incoming canonical unit; omitted for piece counts
 *
 * @example
 * mergeMeatQuantity({ quantity: 500, unit: 'g' }, 4, undefined)
 * // line becomes { quantity: 500, unit: 'g', pieceCount: 4 }
 */
function mergeMeatQuantity(
  line: MutableLine,
  quantity: number,
  unit?: string,
): void {
  if (isWeightOrVolumeUnit(unit)) {
    const grams = unit === 'kg' ? quantity * 1000 : quantity
    if (isWeightOrVolumeUnit(line.unit)) {
      const existingGrams =
        line.unit === 'kg' ? (line.quantity ?? 0) * 1000 : (line.quantity ?? 0)
      line.quantity = existingGrams + grams
      line.unit = 'g'
      return
    }
    if (line.quantity != null && !line.unit) {
      line.pieceCount = line.pieceCount ?? line.quantity
      line.quantity = grams
      line.unit = 'g'
      return
    }
    line.quantity = (line.quantity ?? 0) + grams
    line.unit = 'g'
    return
  }

  // Piece / pack counts (no unit, or slice/can-style units)
  if (unit && !isWeightOrVolumeUnit(unit)) {
    if (line.unit === unit) {
      line.quantity = (line.quantity ?? 0) + quantity
      return
    }
    if (isWeightOrVolumeUnit(line.unit)) {
      line.pieceCount = (line.pieceCount ?? 0) + quantity
      return
    }
    if (line.quantity != null && !line.unit) {
      line.unit = unit
      line.quantity = line.quantity + quantity
      return
    }
    line.quantity = (line.quantity ?? 0) + quantity
    line.unit = unit
    return
  }

  if (isWeightOrVolumeUnit(line.unit)) {
    line.pieceCount = (line.pieceCount ?? 0) + quantity
    return
  }

  line.quantity = (line.quantity ?? 0) + quantity
  line.unit = undefined
}

/**
 * Parses a unicode or ascii fraction / mixed number into a float.
 *
 * @param raw - Quantity token such as "2", "1/2", "1½", "1 1/2", or "2-3"
 * @returns Numeric value (ranges use the higher end for shopping), or undefined
 *
 * @example
 * parseQuantityToken('1½') // 1.5
 * parseQuantityToken('2-3') // 3
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

  // Ranges like 2-3 or 1/4 – 1/2 → buy enough (higher end)
  const range = cleaned.split(/\s*[–—-]\s*/)
  if (range.length === 2 && range[0] && range[1]) {
    const high = parseQuantityToken(range[1])
    if (high != null) return high
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
  if (/^(fluid ounces?|fl oz|floz)$/.test(u)) return 'fl oz'
  if (/^pinches?$/.test(u)) return 'pinch'
  if (/^dashes?$/.test(u)) return 'dash'
  if (/^handfuls?$/.test(u)) return 'handful'
  if (/^cloves?$/.test(u)) return 'clove'
  if (/^stalks?$/.test(u)) return 'stalk'
  if (/^cans?$/.test(u)) return 'can'
  if (/^tins?$/.test(u)) return 'tin'
  if (/^jars?$/.test(u)) return 'jar'
  if (/^packs?$/.test(u)) return 'pack'
  if (/^packets?$/.test(u)) return 'packet'
  if (/^packages?$/.test(u)) return 'package'
  if (/^bunches?$/.test(u)) return 'bunch'
  if (/^slices?$/.test(u)) return 'slice'
  if (/^pieces?$/.test(u)) return 'piece'
  if (/^sticks?$/.test(u)) return 'stick'
  if (/^heads?$/.test(u)) return 'head'
  if (/^sprigs?$/.test(u)) return 'sprig'

  return u
}

/**
 * Prepares raw ingredient text before qty/unit parsing.
 * Prefers metric in dual units (20g/¾oz), strips filler words.
 *
 * @param text - Raw recipe ingredient line
 * @returns Normalised line ready to parse
 *
 * @example
 * preprocessIngredientText('20g/¾oz ginger') // '20g ginger'
 * preprocessIngredientText('this garlic bread') // 'garlic bread'
 */
export function preprocessIngredientText(text: string): string {
  let line = decodeHtmlEntities(text.trim())
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')

  // Prefer the first unit in dual forms: 20g/¾oz, 600ml/20floz, 150g/5½oz
  line = line.replace(
    /(\d+(?:[./]\d+)?(?:[¼½¾⅓⅔]|[\u00bc-\u00be\u2150-\u215e])?)\s*(g|kg|ml|l|oz|floz|fl\.?\s*oz)\s*\/\s*[^\s]+/gi,
    '$1$2',
  )

  line = line
    .replace(/\blb\./gi, 'lb')
    .replace(/\boz\./gi, 'oz')
    // Package-size adjectives before a container: "one 25-ounce jar" → "jar"
    .replace(
      /\b(?:one|two|a|an)?\s*\d+[-\s]?(?:ounce|oz)s?\s+(?=jar|can|tin|package|pack|bottle)/gi,
      ' ',
    )
    .replace(/\b(one|two|a|an|this|your favorite)\b/gi, ' ')
    .replace(/\bzest and juice of\b/gi, '')
    .replace(/\bjuice of\b/gi, '')
    .replace(/\bzest of\b/gi, '')
    .replace(/\bzest and\b/gi, '')
    .replace(/\bor meatless alternative\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return line
}

/**
 * Cleans ingredient name text for display and merge keys.
 *
 * @param name - Product portion of the ingredient line
 * @returns Trimmed name without trailing recipe notes
 *
 * @example
 * cleanIngredientName('salt to taste') // 'salt'
 */
function cleanIngredientName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, ' ')
    // Drop leftover store notes / unbalanced closing parens: "Costco)", "from Tesco)"
    .replace(/\b(from\s+)?(costco|tesco|sainsbury'?s|asda|aldi|waitrose|walmart|trader\s*joe'?s)\b\)?/gi, ' ')
    .replace(/\)+$/g, ' ')
    .replace(USE_PHRASES, ' ')
    .replace(/\bor a can of\b.*/i, ' ')
    .replace(/\bor meatless alternative\b/gi, ' ')
    // Drop leading qty/unit leftovers when the whole line became the "name"
    .replace(
      /^\d+(?:\.\d+)?(?:\s*[–—-]\s*(?:\d+\/\d+|\d+(?:\.\d+)?))?\s*(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|ml|g|oz|ounces?|lb|lbs|cans?|jars?|tins?|packages?)?\s*/i,
      '',
    )
    .replace(/^(can|tin|jar|package|pack)(\s+of)?\s+/i, '')
    .replace(/,.*$/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Splits combined seasoning / alternative lines into separate items.
 *
 * @param text - Raw ingredient line (may include qty/units)
 * @returns One or more lines to parse individually
 *
 * @example
 * expandCompoundIngredient('salt and red pepper flakes')
 * // ['salt', 'red pepper flakes']
 */
export function expandCompoundIngredient(text: string): string[] {
  const decoded = preprocessIngredientText(text)
  if (!decoded) return []

  if (
    /\bsalt\s*(?:\+|and|&)\s*(?:freshly\s+)?(?:ground\s+)?(?:black\s+|white\s+)?pepper\b/i.test(
      decoded,
    )
  ) {
    return ['salt', 'black pepper']
  }

  if (/\bsalt\s*(?:\+|and|&)\s+red pepper flakes\b/i.test(decoded)) {
    return ['salt', 'red pepper flakes']
  }

  if (/\s\+\s/.test(decoded)) {
    return decoded
      .split(/\s\+\s/)
      .map((part) => part.trim())
      .filter(Boolean)
  }

  // Jam alternatives stay as one pantry item
  if (/\bjam\b/i.test(decoded) && /\bor\b/i.test(decoded)) {
    return [decoded]
  }

  // "tomato sauce or a can of san marzano tomatoes" → both options
  if (
    /\btomato sauce\b/i.test(decoded) &&
    /\bor\b/i.test(decoded) &&
    /\btomatoes?\b/i.test(decoded)
  ) {
    return ['tomato sauce', 'canned tomatoes']
  }

  // "olive oil or butter" → both as presence checks when the right side is short
  const orSplit = decoded.match(/^(.*?)\s+or\s+(.+)$/i)
  if (orSplit?.[1] && orSplit[2]) {
    const left = orSplit[1].trim()
    const right = orSplit[2].trim()
    if (right.split(/\s+/).length <= 4) {
      return [left, right]
    }
  }

  return [decoded]
}

/**
 * Maps recipe wording to a short canonical product name for merging.
 *
 * @param name - Cleaned ingredient name
 * @returns Canonical shopping name
 *
 * @example
 * canonicalShoppingName('table salt') // 'salt'
 * canonicalShoppingName('parmesan cheese') // 'parmesan'
 */
export function canonicalShoppingName(name: string): string {
  let cleaned = cleanIngredientName(name)
    .replace(PREP_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  if (!cleaned) return cleanIngredientName(name).toLowerCase() || name

  cleaned = cleaned.replace(/^of\s+/, '').replace(/\s+/g, ' ').trim()

  // Match aliases before stripping "leaves"/"cloves" so "bay leaves" stays intact
  for (const { pattern, name: alias } of NAME_ALIASES) {
    if (pattern.test(cleaned)) return alias
  }

  cleaned = cleaned
    .replace(/\b(leaves|leaf|stalks?|cloves?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  for (const { pattern, name: alias } of NAME_ALIASES) {
    if (pattern.test(cleaned)) return alias
  }

  // Pepper the spice — not bell / chilli peppers
  if (
    /\bpepper\b/.test(cleaned) &&
    !/\b(bell|chilli|chili|jalape[nñ]o|sweet|flakes|red pepper|green pepper)\b/.test(
      cleaned,
    )
  ) {
    return 'black pepper'
  }

  return cleaned
}

/**
 * Whether an ingredient should be omitted from the shopping list.
 *
 * @param name - Canonical or cleaned product name
 * @returns True for non-shoppable staples like water
 *
 * @example
 * isNonShoppable('water') // true
 */
export function isNonShoppable(name: string): boolean {
  const key = name.toLowerCase().trim()
  if (!key) return true
  if (ORPHAN_DESCRIPTORS.has(key)) return true
  if (NON_SHOPPABLE_PATTERN.test(key)) return true
  // Stray store/paren fragments after cleaning
  if (/^[a-z]+\)+$/i.test(key)) return true
  if (
    /^(costco|tesco|sainsbury'?s|asda|aldi|waitrose|walmart)$/i.test(key)
  ) {
    return true
  }
  if (
    /\bwater\b/.test(key) &&
    !/\b(watermelon|watercress|water\s*chestnuts?|coconut\s+water|soda\s+water|tonic\s+water)\b/.test(
      key,
    )
  ) {
    return true
  }
  if (/cooking spray/i.test(key)) return true
  // Long unresolved "X or Y" lines that escaped splitting
  if (/\bor\b/.test(key) && key.split(/\s+/).length > 6) return true
  return false
}

/**
 * Converts imperial recipe amounts to metric units common in UK cooking.
 * oz/lb → g, fl oz → ml. Already-metric units are left alone.
 *
 * @param quantity - Amount to convert
 * @param unit - Canonical unit from parsing
 * @returns Metric quantity and unit for the shopping list
 *
 * @example
 * toCommonMetric(8, 'oz') // { quantity: 225, unit: 'g' }
 * toCommonMetric(0.5, 'lb') // { quantity: 225, unit: 'g' }
 * toCommonMetric(50, 'g') // { quantity: 50, unit: 'g' }
 */
export function toCommonMetric(
  quantity: number,
  unit: string,
): { quantity: number; unit: string } {
  switch (unit) {
    case 'oz':
      return { quantity: Math.round(quantity * 28.35), unit: 'g' }
    case 'lb':
      return { quantity: Math.round(quantity * 453.6), unit: 'g' }
    case 'kg':
      return quantity >= 1
        ? { quantity: Math.round(quantity * 100) / 100, unit: 'kg' }
        : { quantity: Math.round(quantity * 1000), unit: 'g' }
    case 'fl oz':
      return { quantity: Math.round(quantity * 29.6), unit: 'ml' }
    case 'l':
      return quantity >= 1
        ? { quantity: Math.round(quantity * 100) / 100, unit: 'l' }
        : { quantity: Math.round(quantity * 1000), unit: 'ml' }
    default:
      return { quantity, unit }
  }
}

/**
 * Parses a free-text recipe ingredient into quantity, optional unit, and name.
 *
 * @param text - Raw ingredient line from a recipe
 * @returns Parsed parts ready to scale and merge
 *
 * @example
 * parseIngredientText('4 tbsp olive oil')
 * // { quantity: 4, unit: 'tbsp', name: 'olive oil' }
 */
export function parseIngredientText(text: string): ParsedIngredient {
  const trimmed = preprocessIngredientText(text)
  if (!trimmed) return { name: '' }

  // "2 cloves garlic" / "garlic cloves" style already covered by unit parse
  const withUnit = trimmed.match(INGREDIENT_WITH_UNIT)
  if (withUnit?.groups) {
    const quantity = parseQuantityToken(withUnit.groups.qty)
    const unit = normaliseUnit(withUnit.groups.unit)
    const name = cleanIngredientName(withUnit.groups.name)
    if (name) {
      return {
        name,
        ...(quantity != null ? { quantity } : {}),
        ...(unit ? { unit } : {}),
      }
    }
  }

  // "20g ginger" / "20gginger" without a required space before the unit
  const glued = trimmed.match(
    new RegExp(
      `^${QTY_PATTERN}\\s*(?<unit>${UNIT_PATTERN})\\s*(?<name>[a-zA-Z].*)$`,
      'i',
    ),
  )
  if (glued?.groups) {
    const quantity = parseQuantityToken(glued.groups.qty)
    const unit = normaliseUnit(glued.groups.unit)
    const name = cleanIngredientName(glued.groups.name)
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
    const quantity = parseQuantityToken(countOnly.groups.qty)
    const name = cleanIngredientName(countOnly.groups.name)
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
 * categoriseIngredient('chicken stock') // 'pantry'
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
 */
export function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity)
  const rounded = Math.round(quantity * 100) / 100
  return String(rounded)
}

/**
 * Whether a unit is a cooking measure rather than a buyable pack/weight.
 *
 * @param unit - Canonical unit from `normaliseUnit`
 * @returns True for tbsp/cup/tsp/clove-style measures
 *
 * @example
 * isKitchenMeasure('tbsp') // true
 * isKitchenMeasure('g') // false
 */
export function isKitchenMeasure(unit: string): boolean {
  return KITCHEN_MEASURE_UNITS.has(unit)
}

/**
 * Drops recipe kitchen measures and presence-only staples so the list
 * only checks that the item is needed.
 *
 * @param parsed - Parsed ingredient after text parse + canonical name
 * @returns Presence-only line when amounts are not shoppable
 *
 * @example
 * toShoppingAmount({ name: 'olive oil', quantity: 4, unit: 'tbsp' })
 * // { name: 'olive oil' }
 */
export function toShoppingAmount(parsed: ParsedIngredient): ParsedIngredient {
  const canonical = canonicalShoppingName(parsed.name)
  if (PRESENCE_ONLY_NAMES.has(canonical)) {
    return { name: canonical }
  }
  // Meat & fish: shop by cut, not recipe grams/pieces
  if (categoriseIngredient(canonical) === 'meat_fish') {
    return { name: canonical }
  }
  if (parsed.unit && isKitchenMeasure(parsed.unit)) {
    return { name: canonical }
  }
  return { ...parsed, name: canonical }
}

/**
 * Rounds merged quantities into buyable amounts (whole eggs, cans, etc.).
 *
 * @param quantity - Scaled/merged quantity
 * @param unit - Optional unit
 * @returns Ceiled/rounded quantity suitable for a shopping list
 *
 * @example
 * roundShoppingQuantity(0.17, undefined) // 1
 * roundShoppingQuantity(0.5, 'can') // 1
 * roundShoppingQuantity(3.75, undefined) // 4
 */
export function roundShoppingQuantity(
  quantity: number,
  unit?: string,
): number {
  if (unit && CEIL_UNITS.has(unit)) {
    return Math.max(1, Math.ceil(quantity - 1e-9))
  }
  if (!unit) {
    return Math.max(1, Math.ceil(quantity - 1e-9))
  }
  if (unit === 'g' || unit === 'ml') {
    return Math.max(1, Math.round(quantity))
  }
  if (unit === 'lb' || unit === 'oz' || unit === 'kg') {
    const rounded = Math.round(quantity * 100) / 100
    return rounded < 0.1 ? 0.1 : rounded
  }
  return Math.round(quantity * 100) / 100
}

/**
 * Picks a singular/plural display form for countable items.
 *
 * @param name - Canonical singular shopping name
 * @param quantity - Amount being bought
 * @returns Name inflected for the quantity
 *
 * @example
 * pluralizeName('carrot', 1) // 'carrot'
 * pluralizeName('carrot', 2) // 'carrots'
 * pluralizeName('shallot', 2) // 'shallots'
 */
export function pluralizeName(name: string, quantity: number): string {
  if (quantity === 1) return name
  if (name === 'bay leaf') return 'bay leaves'
  if (name === 'cheese tortellini') return name
  if (name.endsWith('s')) return name
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) {
    return `${name.slice(0, -1)}ies`
  }
  return `${name}s`
}

/**
 * Picks singular/plural for a measurement unit in display labels.
 *
 * @param unit - Canonical unit such as slice or can
 * @param quantity - Amount being bought
 * @returns Unit inflected for the quantity
 *
 * @example
 * pluralizeUnit('slice', 2) // 'slices'
 * pluralizeUnit('g', 50) // 'g'
 */
export function pluralizeUnit(unit: string, quantity: number): string {
  if (TIGHT_DISPLAY_UNITS.has(unit) || quantity === 1) return unit
  if (unit.endsWith('s')) return unit
  if (unit.endsWith('ch') || unit.endsWith('sh') || unit.endsWith('x')) {
    return `${unit}es`
  }
  return `${unit}s`
}

/**
 * Builds the visible label for one shopping line.
 * Amounts always render as `{qty}{unit} {name}` so the unit sits tight against the value.
 *
 * @param item - Aggregated shopping-list item
 * @returns Label such as "olive oil", "50g lentils", or "4 eggs"
 *
 * @example
 * formatShoppingLine({ name: 'lentils', quantity: 50, unit: 'g' }) // '50g lentils'
 * formatShoppingLine({ name: 'carrot', quantity: 2 }) // '2 carrots'
 */
export function formatShoppingLine(
  item: Pick<
    ShoppingListItem,
    'name' | 'quantity' | 'unit' | 'pieceCount'
  >,
): string {
  if (item.quantity == null) return item.name

  const amountParts: string[] = []

  if (item.unit) {
    const unitSuffix = TIGHT_DISPLAY_UNITS.has(item.unit)
      ? item.unit
      : ` ${pluralizeUnit(item.unit, item.quantity)}`
    amountParts.push(`${formatQuantity(item.quantity)}${unitSuffix}`)
  } else {
    amountParts.push(
      `${formatQuantity(item.quantity)} ${pluralizeName(item.name, item.quantity)}`,
    )
  }

  if (item.pieceCount != null && item.pieceCount > 0) {
    amountParts.push(
      `${formatQuantity(item.pieceCount)} ${pluralizeName(item.name, item.pieceCount)}`,
    )
  }

  if (item.pieceCount != null && item.pieceCount > 0) {
    return amountParts.join(' + ')
  }

  if (item.unit) {
    return `${amountParts[0]} ${item.name}`
  }

  return amountParts[0]
}

/**
 * Scales a parsed ingredient by how many recipe servings were added to the plan.
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
 * @param plan - Meal plan to scan
 * @param recipes - Recipe library used to resolve `recipeId` references
 * @returns Category groups with merged items (empty groups omitted)
 *
 * @example
 * buildShoppingList(plan, recipes)
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
    const canonical = canonicalShoppingName(parsed.name)
    if (!canonical || isNonShoppable(canonical)) return

    let quantity = parsed.quantity
    let unit = parsed.unit

    // Normalise imperial amounts to metric before merging
    if (quantity != null && unit) {
      const metric = toCommonMetric(quantity, unit)
      quantity = metric.quantity
      unit = metric.unit
    }

    const resolvedCategory = category ?? categoriseIngredient(canonical)
    const key = mergeLineKey(canonical, quantity, unit, resolvedCategory)

    const existing = lines.get(key)

    if (!existing) {
      lines.set(key, {
        name: canonical,
        displayName: canonical,
        quantity,
        unit,
        category: resolvedCategory,
        recipeCount: 1,
      })
      return
    }

    existing.recipeCount += 1
    if (quantity == null) return

    if (MERGE_BY_NAME_CATEGORIES.has(resolvedCategory)) {
      mergeMeatQuantity(existing, quantity, unit)
      return
    }

    if (quantity != null) {
      existing.quantity = (existing.quantity ?? 0) + quantity
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
            for (const part of expandCompoundIngredient(ingredient.text)) {
              const forShopping = toShoppingAmount(parseIngredientText(part))
              const parsed = scaleParsedIngredient(forShopping, scale)
              addLine(parsed)
            }
          }
          continue
        }

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

  // Second pass: if the same product appears both as presence and with amounts,
  // keep a single presence line (oils/garlic already presence-only).
  const presenceNames = new Set(
    [...lines.values()]
      .filter((line) => line.quantity == null)
      .map((line) => line.name),
  )
  for (const [key, line] of lines) {
    if (line.quantity != null && presenceNames.has(line.name)) {
      lines.delete(key)
    }
  }

  const items: ShoppingListItem[] = [...lines.values()].map((line, index) => {
    const quantity =
      line.quantity != null
        ? roundShoppingQuantity(line.quantity, line.unit)
        : undefined
    const pieceCount =
      line.pieceCount != null
        ? roundShoppingQuantity(line.pieceCount)
        : undefined

    return {
      id: `${line.name}-${line.unit ?? 'count'}-${index}`,
      name: line.displayName,
      ...(quantity != null ? { quantity } : {}),
      ...(line.unit ? { unit: line.unit } : {}),
      ...(pieceCount != null ? { pieceCount } : {}),
      category: line.category,
      recipeCount: line.recipeCount,
    }
  })

  return SHOPPING_CATEGORY_META.map(({ category, label }) => ({
    category,
    label,
    items: items
      .filter((item) => item.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0)
}
