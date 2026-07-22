import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import ImportRecipeDialog from '#/components/ImportRecipeDialog'
import NewRecipeDialog from '#/components/NewRecipeDialog'
import RecipeCard from '#/components/RecipeCard'
import RecipeDetailPanel from '#/components/RecipeDetailPanel'
import RecipeEmptyState from '#/components/RecipeEmptyState'
import WorkspaceNav from '#/components/WorkspaceNav'
import { useRecipes } from '#/hooks/useRecipes'
import type { Recipe } from '#/types/recipe'

import workspaceStyles from '#/styles/workspace-page.module.css'

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
})

function RecipesPage() {
  const { recipes, loading, addRecipe, addImportedRecipe, removeRecipe } = useRecipes()
  const [importOpen, setImportOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  return (
    <div className={workspaceStyles.layout}>
      <WorkspaceNav />

      <main className={workspaceStyles.main}>
        <header className={workspaceStyles.pageHeader}>
          <div className={workspaceStyles.pageTitle}>
            <p className={workspaceStyles.eyebrow}>Library</p>
            <h1>Recipes</h1>
          </div>
          <div className={workspaceStyles.pageActions}>
            <button
              type="button"
              className={workspaceStyles.linkBtn}
              onClick={() => setImportOpen(true)}
            >
              Import from URL
            </button>
            <button
              type="button"
              className={workspaceStyles.primaryBtn}
              onClick={() => setNewOpen(true)}
            >
              + New recipe
            </button>
          </div>
        </header>

        {loading && <p className={workspaceStyles.status}>Loading recipes…</p>}

        {!loading && recipes.length === 0 && (
          <RecipeEmptyState
            onNewRecipe={() => setNewOpen(true)}
            onImportUrl={() => setImportOpen(true)}
          />
        )}

        {!loading && recipes.length > 0 && (
          <section className={workspaceStyles.section}>
            <ul className={workspaceStyles.cardGrid}>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={setSelectedRecipe}
                />
              ))}
            </ul>
          </section>
        )}
      </main>

      <RecipeDetailPanel
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onDelete={removeRecipe}
      />

      <ImportRecipeDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSave={addImportedRecipe}
      />

      <NewRecipeDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={addRecipe}
      />
    </div>
  )
}
