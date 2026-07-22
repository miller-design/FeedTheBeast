import Dexie from 'dexie'
import type { Table } from 'dexie'

import type { MealPlan, SavedMeal } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

/** IndexedDB database for all local meal planner data */
export class FeedTheBeastDB extends Dexie {
  mealPlans!: Table<MealPlan, string>
  savedMeals!: Table<SavedMeal, string>
  recipes!: Table<Recipe, string>

  constructor() {
    super('FeedTheBeastDB')
    this.version(1).stores({
      mealPlans: 'id, name, createdAt, updatedAt',
      savedMeals: 'id, name, createdAt',
    })
    this.version(2).stores({
      mealPlans: 'id, name, createdAt, updatedAt',
      savedMeals: 'id, name, createdAt',
      recipes: 'id, name, sourceSite, createdAt, updatedAt',
    })
  }
}

export const db = new FeedTheBeastDB()
