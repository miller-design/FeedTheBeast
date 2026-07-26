import { describe, expect, it } from 'vitest'

import {
  categoriseIngredient,
  formatShoppingLine,
  parseIngredientText,
  toShoppingAmount,
} from '#/lib/shopping-list'

describe('parseIngredientText', () => {
  it('keeps measurement units with the quantity, not the product count', () => {
    expect(parseIngredientText('4 tbsp olive oil')).toEqual({
      quantity: 4,
      unit: 'tbsp',
      name: 'olive oil',
    })
  })

  it('parses countable items without inventing a unit', () => {
    expect(parseIngredientText('2 large eggs')).toEqual({
      quantity: 2,
      name: 'large eggs',
    })
  })

  it('handles bare names and fractions', () => {
    expect(parseIngredientText('salt')).toEqual({ name: 'salt' })
    expect(parseIngredientText('1/2 cup milk')).toEqual({
      quantity: 0.5,
      unit: 'cup',
      name: 'milk',
    })
  })
})

describe('toShoppingAmount', () => {
  it('drops kitchen measures so the list is presence-only', () => {
    expect(
      toShoppingAmount({
        name: 'olive oil',
        quantity: 4,
        unit: 'tbsp',
      }),
    ).toEqual({ name: 'olive oil' })

    expect(
      toShoppingAmount({
        name: 'milk',
        quantity: 1 / 3,
        unit: 'cup',
      }),
    ).toEqual({ name: 'milk' })
  })

  it('keeps buyable weights and plain counts', () => {
    expect(
      toShoppingAmount({
        name: 'chicken',
        quantity: 400,
        unit: 'g',
      }),
    ).toEqual({ name: 'chicken', quantity: 400, unit: 'g' })

    expect(toShoppingAmount({ name: 'eggs', quantity: 4 })).toEqual({
      name: 'eggs',
      quantity: 4,
    })
  })
})

describe('categoriseIngredient', () => {
  it('groups common grocery items into aisles', () => {
    expect(categoriseIngredient('olive oil')).toBe('pantry')
    expect(categoriseIngredient('cheddar cheese')).toBe('dairy_eggs')
    expect(categoriseIngredient('chicken breast')).toBe('meat_fish')
    expect(categoriseIngredient('black pepper')).toBe('spices')
  })
})

describe('formatShoppingLine', () => {
  it('renders presence and counted lines clearly', () => {
    expect(formatShoppingLine({ name: 'olive oil' })).toBe('olive oil')
    expect(formatShoppingLine({ name: 'eggs', quantity: 4 })).toBe('4 eggs')
  })
})
