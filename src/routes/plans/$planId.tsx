import { createFileRoute } from '@tanstack/react-router'

import PlanEditor from '#/components/PlanEditor'
import { useMealPlan } from '#/hooks/useMealPlan'

import styles from './styles.module.css'

export const Route = createFileRoute('/plans/$planId')({
  validateSearch: (search: Record<string, unknown>) => ({
    edit:
      search.edit === true ||
      search.edit === 'true' ||
      search.edit === 1 ||
      search.edit === '1',
  }),
  component: PlanPage,
})

function PlanPage() {
  const { planId } = Route.useParams()
  const { edit } = Route.useSearch()
  const { plan, loading, saving, savePlan } = useMealPlan(planId)

  if (loading) {
    return (
      <main className={styles.main}>
        <p>Loading plan…</p>
      </main>
    )
  }

  if (!plan) {
    return (
      <main className={styles.main}>
        <h1>Plan not found</h1>
        <p>This meal plan does not exist or has been deleted.</p>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <PlanEditor
        plan={plan}
        saving={saving}
        onSave={savePlan}
        initialMode={edit ? 'edit' : 'use'}
      />
    </main>
  )
}
