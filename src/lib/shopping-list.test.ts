import { describe, expect, it } from 'vitest'

import {
  buildShoppingList,
  canonicalShoppingName,
  categoriseIngredient,
  expandCompoundIngredient,
  formatShoppingLine,
  isNonShoppable,
  parseIngredientText,
  preprocessIngredientText,
  roundShoppingQuantity,
  toCommonMetric,
  toShoppingAmount,
} from '#/lib/shopping-list'
import type { MealPlan } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

describe('preprocessIngredientText', () => {
  it('prefers metric in dual unit forms and keeps ounce quantities', () => {
    expect(preprocessIngredientText('20g/¾oz ginger')).toBe('20g ginger')
    expect(
      preprocessIngredientText('10-15 ounces of refrigerated cheese tortellini'),
    ).toContain('ounces')
    expect(preprocessIngredientText('this garlic bread')).toBe('garlic bread')
  })
})

describe('parseIngredientText', () => {
  it('does not treat g/l as units inside garlic/limes', () => {
    expect(parseIngredientText('1 garlic')).toEqual({
      quantity: 1,
      name: 'garlic',
    })
    expect(parseIngredientText('2 limes')).toEqual({
      quantity: 2,
      name: 'limes',
    })
  })

  it('parses ounce ranges for packaged foods', () => {
    expect(
      parseIngredientText('10-15 ounces of refrigerated cheese tortellini'),
    ).toEqual({
      quantity: 15,
      unit: 'oz',
      name: 'refrigerated cheese tortellini',
    })
  })

  it('parses ranges using the higher end', () => {
    expect(parseIngredientText('6-8 chicken thighs')).toEqual({
      quantity: 8,
      name: 'chicken thighs',
    })
  })
})

describe('expandCompoundIngredient', () => {
  it('splits oil and tomato alternatives but keeps jam together', () => {
    expect(expandCompoundIngredient('olive oil or butter')).toEqual([
      'olive oil',
      'butter',
    ])
    expect(
      expandCompoundIngredient(
        'tomato sauce or a can of san marzano tomatoes',
      ),
    ).toEqual(['tomato sauce', 'canned tomatoes'])
    expect(
      expandCompoundIngredient('lingonberry or blueberry jam'),
    ).toEqual(['lingonberry or blueberry jam'])
  })
})

describe('canonicalShoppingName', () => {
  it('collapses the variants from the messy list', () => {
    expect(canonicalShoppingName('can of san marzano tomatoes')).toBe(
      'canned tomatoes',
    )
    expect(canonicalShoppingName('can tomatoes')).toBe('canned tomatoes')
    expect(canonicalShoppingName('canned tomatoes')).toBe('canned tomatoes')
    expect(canonicalShoppingName('kale salad')).toBe('kale')
    expect(canonicalShoppingName('yellow onion')).toBe('onion')
    expect(canonicalShoppingName('bay leaves')).toBe('bay leaf')
    expect(canonicalShoppingName('arlic')).toBe('garlic')
    expect(canonicalShoppingName('imes')).toBe('lime')
    expect(canonicalShoppingName('oil')).toBe('olive oil')
    expect(canonicalShoppingName('jar of tomato sauce')).toBe('tomato sauce')
    expect(canonicalShoppingName('chicken broth')).toBe('chicken stock')
    expect(canonicalShoppingName('bone-in chicken thighs')).toBe('chicken thigh')
    expect(canonicalShoppingName('chicken breasts')).toBe('chicken breast')
    expect(canonicalShoppingName('chicken')).toBe('chicken breast')
  })
})

describe('isNonShoppable', () => {
  it('skips water, orphan adjectives, and leftover fragments', () => {
    expect(isNonShoppable('water')).toBe(true)
    expect(isNonShoppable('natural')).toBe(true)
    expect(isNonShoppable('toasted')).toBe(true)
    expect(isNonShoppable('meatless alternative')).toBe(true)
  })
})

describe('toCommonMetric', () => {
  it('converts imperial amounts to UK-style metric', () => {
    expect(toCommonMetric(8, 'oz')).toEqual({ quantity: 227, unit: 'g' })
    expect(toCommonMetric(0.5, 'lb')).toEqual({ quantity: 227, unit: 'g' })
    expect(toCommonMetric(50, 'g')).toEqual({ quantity: 50, unit: 'g' })
  })
})

describe('toShoppingAmount', () => {
  it('drops kitchen measures and garlic clove counts', () => {
    expect(
      toShoppingAmount({
        name: 'olive oil',
        quantity: 4,
        unit: 'tbsp',
      }),
    ).toEqual({ name: 'olive oil' })

    expect(
      toShoppingAmount({
        name: 'garlic',
        quantity: 2,
        unit: 'clove',
      }),
    ).toEqual({ name: 'garlic' })
  })
})

describe('roundShoppingQuantity', () => {
  it('ceils fractional counts and cans', () => {
    expect(roundShoppingQuantity(0.17)).toBe(1)
    expect(roundShoppingQuantity(3.75)).toBe(4)
    expect(roundShoppingQuantity(0.5, 'can')).toBe(1)
  })
})

describe('categoriseIngredient', () => {
  it('puts stock in pantry and produce plurals in produce', () => {
    expect(categoriseIngredient('chicken stock')).toBe('pantry')
    expect(categoriseIngredient('carrot')).toBe('produce')
    expect(categoriseIngredient('bay leaf')).toBe('spices')
    expect(categoriseIngredient('garlic bread')).toBe('bakery')
    expect(categoriseIngredient('gochujang sauce')).toBe('pantry')
    expect(categoriseIngredient('sesame seeds')).toBe('spices')
    expect(categoriseIngredient('kimchi')).toBe('pantry')
    expect(categoriseIngredient('mushrooms')).toBe('produce')
    expect(categoriseIngredient('buns')).toBe('bakery')
  })
})

describe('formatShoppingLine', () => {
  it('keeps the unit tight against the value and pluralizes counts', () => {
    expect(
      formatShoppingLine({ name: 'lentils', quantity: 50, unit: 'g' }),
    ).toBe('50g lentils')
    expect(formatShoppingLine({ name: 'carrot', quantity: 1 })).toBe(
      '1 carrot',
    )
    expect(formatShoppingLine({ name: 'carrot', quantity: 2 })).toBe(
      '2 carrots',
    )
    expect(formatShoppingLine({ name: 'olive oil' })).toBe('olive oil')
    expect(
      formatShoppingLine({ name: 'bacon', quantity: 2, unit: 'slice' }),
    ).toBe('2 slices bacon')
  })
})

describe('buildShoppingList chicken dedup', () => {
  it('lists meat as presence-only breast/thigh and shelves sauces', () => {
    const recipe: Recipe = {
      id: 'r-chicken',
      name: 'Chicken mix',
      servings: 2,
      ingredients: [
        { id: '1', text: '250g bone-in chicken thighs' },
        { id: '2', text: '500g chicken thighs' },
        { id: '3', text: '4 chicken thighs' },
        { id: '4', text: '113g chicken breasts' },
        { id: '5', text: '113g chicken' },
        { id: '6', text: '2 slice bacon' },
        { id: '7', text: '90g satay sauce' },
        { id: '8', text: 'gochujang sauce' },
        { id: '9', text: 'sesame seeds' },
        { id: '10', text: '2 seeded buns' },
        { id: '11', text: 'buns (Costco)' },
        { id: '12', text: '114g shiitake mushrooms' },
        { id: '13', text: 'kimchi' },
        { id: '14', text: 'greens' },
      ],
      instructions: [],
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      tags: [],
      createdAt: '',
      updatedAt: '',
    }

    const plan: MealPlan = {
      id: 'p1',
      slug: 'test',
      name: 'Test plan',
      startDate: '2026-01-01',
      defaultCalorieTarget: 2000,
      createdAt: '',
      updatedAt: '',
      days: [
        {
          date: '2026-01-01',
          calorieTarget: 2000,
          meals: [
            {
              id: 'm1',
              name: 'Dinner',
              items: [
                {
                  id: 'i1',
                  name: 'Chicken mix',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  quantity: 1,
                  unit: 'serving',
                  source: 'recipe',
                  recipeId: 'r-chicken',
                  recipeServings: 2,
                },
              ],
            },
          ],
        },
      ],
    }

    const groups = buildShoppingList(plan, [recipe])
    const byCategory = Object.fromEntries(
      groups.map((g) => [g.category, g.items.map((i) => formatShoppingLine(i))]),
    )
    const allLines = groups.flatMap((g) =>
      g.items.map((i) => formatShoppingLine(i)),
    )
    const allNames = groups.flatMap((g) => g.items.map((i) => i.name))

    expect(byCategory.meat_fish).toEqual(
      expect.arrayContaining(['bacon', 'chicken breast', 'chicken thigh']),
    )
    expect(byCategory.meat_fish).toHaveLength(3)
    expect(allLines.some((line) => /\d/.test(line) && /chicken/.test(line))).toBe(
      false,
    )

    expect(byCategory.pantry).toEqual(
      expect.arrayContaining([
        'gochujang sauce',
        'satay sauce',
        'kimchi',
      ]),
    )
    expect(byCategory.spices).toEqual(expect.arrayContaining(['sesame seeds']))
    expect(byCategory.bakery).toEqual(expect.arrayContaining(['buns']))
    expect(byCategory.produce).toEqual(
      expect.arrayContaining(['greens', '114g mushrooms']),
    )
    expect(allNames).not.toContain('costco)')
    expect(allNames.filter((name) => name === 'buns')).toHaveLength(1)
  })
})

describe('buildShoppingList', () => {
  it('merges tomato/kale/garlic variants and drops junk lines', () => {
    const recipe: Recipe = {
      id: 'r1',
      name: 'Test',
      servings: 2,
      ingredients: [
        { id: '1', text: '1 garlic' },
        { id: '2', text: '2 cloves garlic' },
        { id: '3', text: 'large garlic' },
        { id: '4', text: 'can of san marzano tomatoes' },
        { id: '5', text: '200g canned tomatoes' },
        { id: '6', text: '1 can tomatoes' },
        { id: '7', text: 'kale' },
        { id: '8', text: 'kale salad' },
        { id: '9', text: '2 carrots' },
        { id: '10', text: '1 yellow onion' },
        { id: '11', text: '1 onion' },
        { id: '12', text: '2 limes' },
        { id: '13', text: '1 bay leaves' },
        { id: '14', text: '1/4 cup water' },
        { id: '15', text: '1-2 cups chicken broth' },
        { id: '16', text: 'oil' },
        { id: '17', text: 'olive oil' },
        { id: '18', text: 'italian sausage or meatless alternative' },
        { id: '19', text: 'lingonberry or blueberry jam' },
        { id: '20', text: 'zest and juice of 1 lemon' },
      ],
      instructions: [],
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      tags: [],
      createdAt: '',
      updatedAt: '',
    }

    const plan: MealPlan = {
      id: 'p1',
      slug: 'test',
      name: 'Test plan',
      startDate: '2026-01-01',
      defaultCalorieTarget: 2000,
      createdAt: '',
      updatedAt: '',
      days: [
        {
          date: '2026-01-01',
          calorieTarget: 2000,
          meals: [
            {
              id: 'm1',
              name: 'Dinner',
              items: [
                {
                  id: 'i1',
                  name: 'Test',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  quantity: 1,
                  unit: 'serving',
                  source: 'recipe',
                  recipeId: 'r1',
                  recipeServings: 2,
                },
              ],
            },
          ],
        },
      ],
    }

    const groups = buildShoppingList(plan, [recipe])
    const lines = groups.flatMap((group) =>
      group.items.map((item) => formatShoppingLine(item)),
    )
    const names = groups.flatMap((group) => group.items.map((item) => item.name))

    expect(names.filter((name) => name === 'garlic')).toHaveLength(1)
    expect(names.filter((name) => name === 'canned tomatoes')).toHaveLength(1)
    expect(names.filter((name) => name === 'kale')).toHaveLength(1)
    expect(names.filter((name) => name === 'onion')).toHaveLength(1)
    expect(names.filter((name) => name === 'olive oil')).toHaveLength(1)
    expect(names).toContain('chicken stock')
    expect(names).toContain('bay leaf')
    expect(names).toContain('jam')
    expect(names).toContain('lemon')
    expect(lines).toContain('2 carrots')
    expect(lines).toContain('2 limes')
    expect(names).not.toContain('water')
    expect(names).not.toContain('meatless alternative')
    expect(names).not.toContain('arlic')
    expect(names).not.toContain('imes')
    expect(names).not.toContain('lingonberry')
  })
})
