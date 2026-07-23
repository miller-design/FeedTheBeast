import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import CreatePlanDialog from '#/components/CreatePlanDialog'
import WorkspaceNav from '#/components/WorkspaceNav'
import { formatPlanDate } from '#/lib/dates'
import { useMealPlans } from '#/hooks/useMealPlans'

import workspaceStyles from '#/styles/workspace-page.module.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { plans, loading, createPlan, removePlan } = useMealPlans()
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
            <ul className={workspaceStyles.cardGrid}>
              {plans.map((plan) => {
                const endDate =
                  plan.days[plan.days.length - 1]?.date ?? plan.startDate
                return (
                  <li key={plan.id} className={workspaceStyles.card}>
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
                  </li>
                )
              })}
            </ul>
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
