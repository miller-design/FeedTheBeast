import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import ImportRecipeDialog from '#/components/ImportRecipeDialog'
import NewRecipeDialog from '#/components/NewRecipeDialog'
import RecipeCard from '#/components/RecipeCard'
import RecipeCategoryFilter from '#/components/RecipeCategoryFilter'
import RecipeDetailPanel from '#/components/RecipeDetailPanel'
import RecipeEmptyState from '#/components/RecipeEmptyState'
import WorkspaceNav from '#/components/WorkspaceNav'
import { useMultiSelect } from '#/hooks/useMultiSelect'
import { useRecipes } from '#/hooks/useRecipes'
import { RECIPE_TAGS } from '#/lib/recipe-tags'
import type { RecipeTag } from '#/lib/recipe-tags'
import { buildSeoHead, pageTitle } from '#/lib/seo'
import type { Recipe } from '#/types/recipe'

import workspaceStyles from '#/styles/workspace-page.module.css'

export const Route = createFileRoute('/recipes/')({
  head: () =>
    buildSeoHead({
      title: pageTitle('Recipes'),
      description:
        'Build a recipe library, import from the web, and drop meals into your plans with nutrition per serving.',
      path: '/recipes',
    }),
  component: RecipesPage,
})

/**
 * Returns a recipe's tags, defaulting to [] for legacy records.
 *
 * @param recipe - Recipe that may predate the tags field
 * @returns Controlled tags array
 *
 * @example
 * recipeTags(recipe) // ['breakfast']
 */
function recipeTags(recipe: Recipe): RecipeTag[] {
  return Array.isArray(recipe.tags) ? recipe.tags : []
}

/**
 * Filters recipes by selected meal-type categories.
 *
 * Tag filters use OR matching. When tags and untagged are both inactive,
 * every recipe is returned.
 *
 * @param recipes - Full recipe library
 * @param tagFilters - Selected meal-type tags e.g. `['breakfast']`
 * @param includeUntagged - When true, also include recipes with no tags
 * @returns Matching recipes
 *
 * @example
 * filterRecipesByCategory(recipes, ['dinner'], false)
 */
function filterRecipesByCategory(
  recipes: Recipe[],
  tagFilters: RecipeTag[],
  includeUntagged: boolean,
): Recipe[] {
  if (tagFilters.length === 0 && !includeUntagged) return recipes

  return recipes.filter((recipe) => {
    const tags = recipeTags(recipe)

    if (includeUntagged && tags.length === 0) return true
    if (tagFilters.length > 0 && tagFilters.some((tag) => tags.includes(tag))) {
      return true
    }

    return false
  })
}

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
  const [tagFilters, setTagFilters] = useState<RecipeTag[]>([])
  const [includeUntagged, setIncludeUntagged] = useState(false)

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [recipes, selectedRecipeId],
  )

  const tagCounts = useMemo(() => {
    const counts = Object.fromEntries(
      RECIPE_TAGS.map((tag) => [tag, 0]),
    ) as Record<RecipeTag, number>

    for (const recipe of recipes) {
      for (const tag of recipeTags(recipe)) {
        counts[tag] += 1
      }
    }

    return counts
  }, [recipes])

  const untaggedCount = useMemo(
    () => recipes.filter((recipe) => recipeTags(recipe).length === 0).length,
    [recipes],
  )

  const filteredRecipes = useMemo(
    () => filterRecipesByCategory(recipes, tagFilters, includeUntagged),
    [recipes, tagFilters, includeUntagged],
  )

  const hasActiveFilters = tagFilters.length > 0 || includeUntagged

  const allSelected =
    filteredRecipes.length > 0 &&
    filteredRecipes.every((recipe) => selectedIds.has(recipe.id))

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
            {!selecting ? (
              <div className={workspaceStyles.filterRow}>
                <div className={workspaceStyles.filterRowFilter}>
                  <RecipeCategoryFilter
                    value={tagFilters}
                    onChange={setTagFilters}
                    counts={tagCounts}
                    untaggedCount={untaggedCount}
                    includeUntagged={includeUntagged}
                    onIncludeUntaggedChange={setIncludeUntagged}
                  />
                </div>
                <div className={workspaceStyles.filterRowActions}>
                  <button
                    type="button"
                    className={workspaceStyles.secondaryBtn}
                    onClick={enterSelect}
                  >
                    Select
                  </button>
                </div>
              </div>
            ) : (
              <RecipeCategoryFilter
                value={tagFilters}
                onChange={setTagFilters}
                counts={tagCounts}
                untaggedCount={untaggedCount}
                includeUntagged={includeUntagged}
                onIncludeUntaggedChange={setIncludeUntagged}
              />
            )}

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
                        : selectAll(filteredRecipes.map((recipe) => recipe.id))
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

            {filteredRecipes.length === 0 ? (
              <p className={workspaceStyles.status}>
                No recipes match these categories.
                {hasActiveFilters && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className={workspaceStyles.linkBtn}
                      onClick={() => {
                        setTagFilters([])
                        setIncludeUntagged(false)
                      }}
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </p>
            ) : (
              <ul className={workspaceStyles.cardGrid}>
                {filteredRecipes.map((recipe) => (
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
            )}
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
