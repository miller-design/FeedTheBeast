import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import CreatePlanDialog from '#/components/CreatePlanDialog'
import WorkspaceNav from '#/components/WorkspaceNav'
import { formatPlanDate } from '#/lib/dates'
import { useMealPlans } from '#/hooks/useMealPlans'
import { useMultiSelect } from '#/hooks/useMultiSelect'

import workspaceStyles from '#/styles/workspace-page.module.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { plans, loading, createPlan, removePlan, removePlans } = useMealPlans()
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigate = Route.useNavigate()

  async function handleCreate(input: Parameters<typeof createPlan>[0]) {
    const slug = await createPlan(input)
    void navigate({
      to: '/plans/$planSlug',
      params: { planSlug: slug },
      search: { edit: true },
    })
  }

  /**
   * Confirms and deletes every selected plan, then leaves select mode.
   */
  async function handleBulkDelete() {
    if (selectedCount === 0) return

    const label =
      selectedCount === 1
        ? 'Delete 1 plan? This cannot be undone.'
        : `Delete ${selectedCount} plans? This cannot be undone.`

    if (!confirm(label)) return

    await removePlans([...selectedIds])
    exitSelect()
  }

  const allSelected = plans.length > 0 && selectedCount === plans.length

  return (
    <div className={workspaceStyles.layout}>
      <WorkspaceNav />

      <main className={workspaceStyles.main}>
        <header className={workspaceStyles.pageHeader}>
          <div className={workspaceStyles.pageTitle}>
            <p className={workspaceStyles.eyebrow}>Plans</p>
            <h1>Meal Planner</h1>
          </div>
          <div className={workspaceStyles.pageActions}>
            {!selecting && plans.length > 0 && (
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
              className={workspaceStyles.primaryBtn}
              onClick={() => setDialogOpen(true)}
            >
              + New plan
            </button>
          </div>
        </header>

        <section className={workspaceStyles.section}>
          <h2 className={workspaceStyles.sectionTitle}>Your plans</h2>

          {loading && <p className={workspaceStyles.status}>Loading plans…</p>}

          {!loading && plans.length === 0 && (
            <p className={workspaceStyles.status}>
              No meal plans yet. Create your first plan to get started.
            </p>
          )}

          {!loading && plans.length > 0 && (
            <>
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
                          : selectAll(plans.map((plan) => plan.id))
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
                {plans.map((plan) => {
                  const endDate =
                    plan.days[plan.days.length - 1]?.date ?? plan.startDate
                  const selected = isSelected(plan.id)

                  return (
                    <li
                      key={plan.id}
                      className={[
                        workspaceStyles.card,
                        selecting && selected
                          ? workspaceStyles.cardSelected
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {selecting ? (
                        <button
                          type="button"
                          className={workspaceStyles.cardSelect}
                          onClick={() => toggle(plan.id)}
                          aria-pressed={selected}
                        >
                          <input
                            type="checkbox"
                            className={workspaceStyles.cardCheckbox}
                            checked={selected}
                            readOnly
                            tabIndex={-1}
                            aria-hidden
                          />
                          <div className={workspaceStyles.planBody}>
                            <span className={workspaceStyles.planName}>
                              {plan.name}
                            </span>
                            <span className={workspaceStyles.planDate}>
                              {formatPlanDate(plan.startDate, {
                                day: 'numeric',
                                month: 'short',
                              })}
                              {' – '}
                              {formatPlanDate(endDate, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' · '}
                              {plan.days.length} day
                              {plan.days.length !== 1 ? 's' : ''}
                            </span>
                            <span className={workspaceStyles.planCalories}>
                              {plan.defaultCalorieTarget} kcal/day
                            </span>
                          </div>
                        </button>
                      ) : (
                        <>
                          <div className={workspaceStyles.planBody}>
                            <span className={workspaceStyles.planName}>
                              {plan.name}
                            </span>
                            <span className={workspaceStyles.planDate}>
                              {formatPlanDate(plan.startDate, {
                                day: 'numeric',
                                month: 'short',
                              })}
                              {' – '}
                              {formatPlanDate(endDate, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' · '}
                              {plan.days.length} day
                              {plan.days.length !== 1 ? 's' : ''}
                            </span>
                            <span className={workspaceStyles.planCalories}>
                              {plan.defaultCalorieTarget} kcal/day
                            </span>
                          </div>
                          <div className={workspaceStyles.planFooter}>
                            <Link
                              to="/plans/$planSlug"
                              params={{ planSlug: plan.slug }}
                              search={{ edit: false }}
                              className={workspaceStyles.planOpen}
                            >
                              Open →
                            </Link>
                            <button
                              type="button"
                              className={workspaceStyles.planDelete}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete "${plan.name}"? This cannot be undone.`,
                                  )
                                ) {
                                  void removePlan(plan.id)
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        <CreatePlanDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreate}
        />
      </main>
    </div>
  )
}
