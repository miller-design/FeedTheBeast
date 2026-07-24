import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import ImportRecipeDialog from '#/components/ImportRecipeDialog'
import NewRecipeDialog from '#/components/NewRecipeDialog'
import RecipeCard from '#/components/RecipeCard'
import RecipeDetailPanel from '#/components/RecipeDetailPanel'
import RecipeEmptyState from '#/components/RecipeEmptyState'
import WorkspaceNav from '#/components/WorkspaceNav'
import { useMultiSelect } from '#/hooks/useMultiSelect'
import { useRecipes } from '#/hooks/useRecipes'

import workspaceStyles from '#/styles/workspace-page.module.css'

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
})

function RecipesPage() {
  const {
    recipes,
    loading,
    addRecipe,
    addImportedRecipe,
    getImportedRecipeByUrl,
    removeRecipe,
    removeRecipes,
    setRecipeTags,
    editRecipe,
  } = useRecipes()
  const {
    selecting,
    selectedIds,
    selectedCount,
    enterSelect,
    exitSelect,
    toggle,
    selectAll,
    clear,
    isSelected,
  } = useMultiSelect()
  const [importOpen, setImportOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [recipes, selectedRecipeId],
  )

  const allSelected =
    recipes.length > 0 && selectedCount === recipes.length

  /**
   * Confirms and deletes every selected recipe, then leaves select mode.
   */
  async function handleBulkDelete() {
    if (selectedCount === 0) return

    const label =
      selectedCount === 1
        ? 'Delete 1 recipe? This cannot be undone.'
        : `Delete ${selectedCount} recipes? This cannot be undone.`

    if (!confirm(label)) return

    const ids = [...selectedIds]
    if (selectedRecipeId && ids.includes(selectedRecipeId)) {
      setSelectedRecipeId(null)
    }

    await removeRecipes(ids)
    exitSelect()
  }

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
            {!selecting && recipes.length > 0 && (
              <button
                type="button"
                className={workspaceStyles.secondaryBtn}
                onClick={enterSelect}
              >
                Select
              </button>
            )}
            <button
              type="button"
              className={workspaceStyles.linkBtn}
              onClick={() => setImportOpen(true)}
            >
              Import recipe
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
            {selecting && (
              <div className={workspaceStyles.selectionBar} role="toolbar">
                <div className={workspaceStyles.selectionMeta}>
                  <p className={workspaceStyles.selectionCount}>
                    {selectedCount} selected
                  </p>
                  <button
                    type="button"
                    className={workspaceStyles.selectionLink}
                    onClick={() =>
                      allSelected
                        ? clear()
                        : selectAll(recipes.map((recipe) => recipe.id))
                    }
                  >
                    {allSelected ? 'Clear' : 'Select all'}
                  </button>
                </div>
                <div className={workspaceStyles.selectionActions}>
                  <button
                    type="button"
                    className={workspaceStyles.secondaryBtn}
                    onClick={exitSelect}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={workspaceStyles.dangerBtn}
                    disabled={selectedCount === 0}
                    onClick={() => {
                      void handleBulkDelete()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            <ul className={workspaceStyles.cardGrid}>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={(selected) => setSelectedRecipeId(selected.id)}
                  selecting={selecting}
                  selected={isSelected(recipe.id)}
                  onToggleSelect={toggle}
                />
              ))}
            </ul>
          </section>
        )}
      </main>

      <RecipeDetailPanel
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipeId(null)}
        onDelete={removeRecipe}
        onUpdateTags={setRecipeTags}
        onUpdateRecipe={editRecipe}
      />

      <ImportRecipeDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSave={addImportedRecipe}
        onCheckDuplicate={async (sourceUrl) => {
          const existing = await getImportedRecipeByUrl(sourceUrl)
          return existing ? { id: existing.id, name: existing.name } : undefined
        }}
        onOpenExisting={(recipeId) => setSelectedRecipeId(recipeId)}
      />

      <NewRecipeDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={addRecipe}
      />
    </div>
  )
}
