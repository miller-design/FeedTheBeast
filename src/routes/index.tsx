import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import CreatePlanDialog from '#/components/CreatePlanDialog'
import WorkspaceNav from '#/components/WorkspaceNav'
import { formatPlanDate } from '#/lib/dates'
import { useMealPlans } from '#/hooks/useMealPlans'

import workspaceStyles from '#/styles/workspace-page.module.css'
import styles from './styles.module.css'

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
            <ul className={workspaceStyles.itemList}>
              {plans.map((plan) => {
                const endDate = plan.days[plan.days.length - 1]?.date ?? plan.startDate
                return (
                  <li key={plan.id} className={workspaceStyles.itemCard}>
                    <Link
                      to="/plans/$planSlug"
                      params={{ planSlug: plan.slug }}
                      search={{ edit: false }}
                      className={styles.planLink}
                    >
                      <span className={styles.planName}>{plan.name}</span>
                      <span className={styles.planMeta}>
                        {formatPlanDate(plan.startDate, { day: 'numeric', month: 'short' })}
                        {' – '}
                        {formatPlanDate(endDate, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' · '}
                        {plan.days.length} day{plan.days.length !== 1 ? 's' : ''}
                        {' · '}
                        {plan.defaultCalorieTarget} kcal/day
                      </span>
                    </Link>
                    <button
                      type="button"
                      className={workspaceStyles.listDeleteBtn}
                      onClick={() => {
                        if (confirm(`Delete "${plan.name}"? This cannot be undone.`)) {
                          void removePlan(plan.id)
                        }
                      }}
                      aria-label={`Delete ${plan.name}`}
                    >
                      Delete
                    </button>
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
