import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

import DayRow from '#/components/DayRow'
import FoodLibrary from '#/components/FoodLibrary'
import type { LibraryPlacePayload } from '#/components/FoodLibrary/types'
import PlanItemDetailPanel from '#/components/PlanItemDetailPanel'
import WorkspaceNav from '#/components/WorkspaceNav'
import { getAllRecipes } from '#/lib/db/recipes'
import { createId } from '#/lib/meal-plan-factory'
import { DND_TYPES, parseMealSlotDropId } from '#/lib/dnd'
import type {
  DragData,
  LibraryFoodDragData,
  LibraryRecipeDragData,
  MealItemDragData,
} from '#/lib/dnd'
import type { FoodEntry, MealPlan, PlanDay } from '#/types/meal-plan'
import type { Recipe } from '#/types/recipe'

import ManualFoodDialog from '#/components/ManualFoodDialog'

import workspaceStyles from '#/styles/workspace-page.module.css'

import type { PlanEditorMode, PlanEditorProps } from './types'
import styles from './styles.module.css'

/** Pending tap-to-place payload (library add or meal-item move). */
type PlacementPayload = LibraryPlacePayload | MealItemDragData

/**
 * Nutricalc-style meal plan editor with drag-and-drop and food library sidebar.
 * Supports mouse drag, touch long-press drag, and tap-to-place for smaller devices.
 *
 * @param props.plan - Current meal plan
 * @param props.saving - Whether a save is in progress
 * @param props.onSave - Persists plan changes
 * @param props.initialMode - `use` for viewing saved plans, `edit` for building
 *
 * @example
 * <PlanEditor plan={plan} saving={false} onSave={savePlan} initialMode="use" />
 */
const PlanEditor = ({
  plan,
  saving,
  onSave,
  initialMode = 'use',
}: PlanEditorProps) => {
  const [localPlan, setLocalPlan] = useState(plan)
  const [mode, setMode] = useState<PlanEditorMode>(initialMode)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [manualFoodOpen, setManualFoodOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [placement, setPlacement] = useState<PlacementPayload | null>(null)

  const isEditing = mode === 'edit'

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  )

  useEffect(() => {
    setLocalPlan(plan)
  }, [plan])

  useEffect(() => {
    void getAllRecipes().then(setRecipes)
  }, [])

  /**
   * Clears tap-to-place and use-mode item selection via Escape or an outside tap.
   * Outside = anything not marked `data-keep-selection` (active meal cards, banner, detail panel).
   */
  useEffect(() => {
    if (!placement && !selectedItemId) return

    /**
     * Drops the current placement and/or selected meal item.
     */
    function clearSelection() {
      setPlacement(null)
      setSelectedItemId(null)
    }

    /**
     * Clears selection when the user presses Escape.
     *
     * @param event - Native keyboard event from the document
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearSelection()
      }
    }

    /**
     * Clears selection when the user taps/clicks outside an active card or related UI.
     *
     * @param event - Pointer event from the document
     */
    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-keep-selection]')) return
      clearSelection()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [placement, selectedItemId])

  /**
   * Clears sidebar selection when leaving use mode.
   *
   * @param nextMode - Mode being switched to
   */
  function switchMode(nextMode: PlanEditorMode) {
    setMode(nextMode)
    setPlacement(null)
    setLibraryOpen(false)
    if (nextMode === 'edit') {
      setSelectedItemId(null)
    }
  }

  /**
   * Persists plan changes and updates local state.
   *
   * @param updated - Modified meal plan
   */
  const persistPlan = useCallback(
    (updated: MealPlan) => {
      setLocalPlan(updated)
      void onSave(updated)
    },
    [onSave],
  )

  /**
   * Updates a single day in the plan.
   *
   * @param dayIndex - Day index to update
   * @param day - Updated day data
   */
  const updateDay = useCallback(
    (dayIndex: number, day: PlanDay) => {
      const days = [...localPlan.days]
      days[dayIndex] = day
      persistPlan({ ...localPlan, days })
    },
    [localPlan, persistPlan],
  )

  /**
   * Adds a food entry to a meal slot.
   *
   * @param dayIndex - Target day index
   * @param slotIndex - Target slot index
   * @param entry - Food entry to add
   */
  const addItemToSlot = useCallback(
    (dayIndex: number, slotIndex: number, entry: FoodEntry) => {
      const day = localPlan.days[dayIndex]
      const meals = [...day.meals]
      const slot = meals[slotIndex]
      meals[slotIndex] = { ...slot, items: [...slot.items, entry] }
      updateDay(dayIndex, { ...day, meals })
    },
    [localPlan.days, updateDay],
  )

  /**
   * Removes a food entry from a meal slot.
   *
   * @param dayIndex - Day index
   * @param slotIndex - Slot index
   * @param itemId - Food entry ID to remove
   */
  const removeItemFromSlot = useCallback(
    (dayIndex: number, slotIndex: number, itemId: string) => {
      const day = localPlan.days[dayIndex]
      const meals = [...day.meals]
      const slot = meals[slotIndex]
      meals[slotIndex] = {
        ...slot,
        items: slot.items.filter((item) => item.id !== itemId),
      }
      updateDay(dayIndex, { ...day, meals })
    },
    [localPlan.days, updateDay],
  )

  /**
   * Moves a food item between meal slots or days.
   *
   * @param fromDay - Source day index
   * @param fromSlot - Source slot index
   * @param itemId - Item to move
   * @param toDay - Target day index
   * @param toSlot - Target slot index
   */
  const moveItem = useCallback(
    (
      fromDay: number,
      fromSlot: number,
      itemId: string,
      toDay: number,
      toSlot: number,
    ) => {
      const sourceDay = localPlan.days[fromDay]
      const sourceSlot = sourceDay.meals[fromSlot]
      const item = sourceSlot.items.find((i) => i.id === itemId)
      if (!item) return

      if (fromDay === toDay && fromSlot === toSlot) return

      const days = localPlan.days.map((day, dayIdx) => {
        const meals = day.meals.map((slot, slotIdx) => {
          if (dayIdx === fromDay && slotIdx === fromSlot) {
            return {
              ...slot,
              items: slot.items.filter((i) => i.id !== itemId),
            }
          }
          if (dayIdx === toDay && slotIdx === toSlot) {
            return { ...slot, items: [...slot.items, item] }
          }
          return slot
        })
        return { ...day, meals }
      })

      persistPlan({ ...localPlan, days })
    },
    [localPlan, persistPlan],
  )

  /**
   * Creates a FoodEntry from library drag data.
   *
   * @param data - Drag payload from food library
   * @returns New food entry
   */
  function entryFromLibraryFood(data: LibraryFoodDragData): FoodEntry {
    return {
      id: createId(),
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      quantity: data.quantity,
      unit: data.unit,
      servingSizeG: data.servingSizeG,
      source: data.source,
      barcode: data.barcode,
    }
  }

  /**
   * Creates a FoodEntry from a dragged recipe.
   *
   * @param data - Drag payload from recipe library
   * @returns New food entry representing one serving
   */
  function entryFromLibraryRecipe(data: LibraryRecipeDragData): FoodEntry {
    return {
      id: createId(),
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      quantity: data.servings,
      unit: 'serving',
      source: 'recipe',
      recipeId: data.recipeId,
      recipeServings: data.servings,
    }
  }

  /**
   * Handles drag start — stores active drag data for overlay and clears tap placement.
   */
  function handleDragStart(event: DragStartEvent) {
    setPlacement(null)
    setActiveDrag(event.active.data.current as DragData)
  }

  /**
   * Handles drag end — adds or moves items based on drop target.
   */
  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)

    const { active, over } = event
    if (!over) return

    const target = parseMealSlotDropId(String(over.id))
    if (!target) return

    const data = active.data.current as DragData
    applyPlacement(data, target.dayIndex, target.slotIndex)
  }

  /**
   * Applies a library add or meal-item move into a target slot.
   *
   * @param data - Drag / placement payload
   * @param dayIndex - Target day index e.g. `0`
   * @param slotIndex - Target meal slot index e.g. `2`
   *
   * @example
   * applyPlacement(libraryFoodPayload, 0, 1)
   */
  function applyPlacement(data: DragData, dayIndex: number, slotIndex: number) {
    if (data.type === DND_TYPES.LIBRARY_FOOD) {
      addItemToSlot(dayIndex, slotIndex, entryFromLibraryFood(data))
      return
    }

    if (data.type === DND_TYPES.LIBRARY_RECIPE) {
      addItemToSlot(dayIndex, slotIndex, entryFromLibraryRecipe(data))
      return
    }

    moveItem(
      data.dayIndex,
      data.slotIndex,
      data.itemId,
      dayIndex,
      slotIndex,
    )
  }

  /**
   * Starts tap-to-place from the food library and closes the mobile drawer.
   *
   * @param payload - Food or recipe from the library
   *
   * @example
   * handlePlaceRequest(libraryFoodPayload)
   */
  function handlePlaceRequest(payload: LibraryPlacePayload) {
    setPlacement(payload)
    setLibraryOpen(false)
  }

  /**
   * Starts tap-to-move for an existing meal item.
   *
   * @param dayIndex - Source day index
   * @param slotIndex - Source slot index
   * @param item - Food entry being moved
   *
   * @example
   * handleRequestMove(0, 1, foodEntry)
   */
  function handleRequestMove(dayIndex: number, slotIndex: number, item: FoodEntry) {
    setPlacement({
      type: DND_TYPES.MEAL_ITEM,
      itemId: item.id,
      dayIndex,
      slotIndex,
      name: item.name,
      calories: item.calories,
    })
  }

  /**
   * Completes tap-to-place into the chosen meal slot.
   *
   * @param dayIndex - Target day index
   * @param slotIndex - Target slot index
   *
   * @example
   * handlePlaceHere(0, 2)
   */
  function handlePlaceHere(dayIndex: number, slotIndex: number) {
    if (!placement) return
    applyPlacement(placement, dayIndex, slotIndex)
    setPlacement(null)
  }

  /**
   * Adds a manually entered food to the first empty slot on day 1.
   * Opens from the food library sidebar.
   *
   * @param entry - Manually created food entry
   */
  function handleManualFood(entry: FoodEntry) {
    addItemToSlot(0, 0, entry)
    setManualFoodOpen(false)
  }

  /**
   * Finds a food entry anywhere in the plan by ID.
   *
   * @param itemId - Food entry ID from a meal slot
   * @returns Matching entry, if still present in the plan
   */
  function findFoodEntry(itemId: string): FoodEntry | undefined {
    for (const day of localPlan.days) {
      for (const slot of day.meals) {
        const item = slot.items.find((entry) => entry.id === itemId)
        if (item) return item
      }
    }

    return undefined
  }

  const sidebarSelection = useMemo(() => {
    if (!selectedItemId) return null

    const item = findFoodEntry(selectedItemId)
    if (!item) return null

    const recipe =
      item.recipeId != null
        ? recipes.find((entry) => entry.id === item.recipeId)
        : undefined

    return { item, recipe }
  }, [localPlan.days, recipes, selectedItemId])

  /**
   * Selects a meal item for the use-mode sidebar.
   *
   * @param item - Food entry clicked in a meal slot
   */
  function handleSelectItem(item: FoodEntry) {
    setSelectedItemId(item.id)
  }

  const placementLabel =
    placement && 'name' in placement ? placement.name : null

  const layout = (
    <div className={workspaceStyles.layout}>
      <WorkspaceNav />

      <main className={styles.main} id="print-area">
        <header className={workspaceStyles.pageHeader}>
          <div className={workspaceStyles.pageTitle}>
            <p className={workspaceStyles.eyebrow}>Plan</p>
            <h1>{localPlan.name}</h1>
            <p className={styles.meta}>
              {localPlan.days.length} day{localPlan.days.length !== 1 ? 's' : ''}
              {isEditing && ' · Editing — changes save automatically'}
              {saving && ' · Saving…'}
            </p>
          </div>
          <div className={workspaceStyles.pageActions}>
            <div className={styles.headerActions}>
              {isEditing ? (
                <button
                  type="button"
                  className={workspaceStyles.secondaryBtn}
                  onClick={() => switchMode('use')}
                >
                  View plan
                </button>
              ) : (
                <button
                  type="button"
                  className={workspaceStyles.secondaryBtn}
                  onClick={() => switchMode('edit')}
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                className={`${workspaceStyles.secondaryBtn} ${styles.printBtn}`}
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          </div>
        </header>

        {placementLabel && (
          <div
            className={styles.placementBanner}
            role="status"
            data-keep-selection
          >
            <p className={styles.placementText}>
              Tap a meal to add <strong>{placementLabel}</strong>
            </p>
            <button
              type="button"
              className={styles.placementCancel}
              onClick={() => setPlacement(null)}
            >
              Cancel
            </button>
          </div>
        )}

        <div className={styles.dayList}>
          {localPlan.days.map((day, dayIndex) => (
            <DayRow
              key={day.date}
              day={day}
              dayIndex={dayIndex}
              readOnly={!isEditing}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
              onCalorieTargetChange={(target) =>
                updateDay(dayIndex, { ...day, calorieTarget: target })
              }
              onRemoveItem={(slotIndex, itemId) =>
                removeItemFromSlot(dayIndex, slotIndex, itemId)
              }
              placementActive={Boolean(placement)}
              onPlaceHere={(slotIndex) => handlePlaceHere(dayIndex, slotIndex)}
              onRequestMove={(slotIndex, item) =>
                handleRequestMove(dayIndex, slotIndex, item)
              }
            />
          ))}
        </div>
      </main>

      {isEditing && (
        <>
          <button
            type="button"
            className={styles.libraryFab}
            onClick={() => setLibraryOpen(true)}
            aria-expanded={libraryOpen}
            hidden={libraryOpen}
          >
            Food library
          </button>
          <FoodLibrary
            recipes={recipes}
            onManualFood={() => setManualFoodOpen(true)}
            onPlaceRequest={handlePlaceRequest}
            mobileOpen={libraryOpen}
            onMobileClose={() => setLibraryOpen(false)}
          />
        </>
      )}
    </div>
  )

  if (!isEditing) {
    return (
      <>
        {layout}
        <PlanItemDetailPanel
          selection={sidebarSelection}
          onClose={() => setSelectedItemId(null)}
        />
      </>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {layout}

      <DragOverlay dropAnimation={null}>
        {activeDrag && 'name' in activeDrag && (
          <div className={styles.dragOverlay}>
            <span className={styles.dragOverlayName}>{activeDrag.name}</span>
            <span className={styles.dragOverlayMeta}>
              {Math.round(activeDrag.calories)} kcal
            </span>
          </div>
        )}
      </DragOverlay>

      <ManualFoodDialog
        open={manualFoodOpen}
        onClose={() => setManualFoodOpen(false)}
        onAdd={handleManualFood}
      />
    </DndContext>
  )
}

export default PlanEditor
