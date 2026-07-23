import { Link } from '@tanstack/react-router'

import WorkspaceNav from '#/components/WorkspaceNav'
import { useCloudAuth } from '#/hooks/useCloudAuth'

import workspaceStyles from '#/styles/workspace-page.module.css'
import styles from './styles.module.css'

type AuthGateProps = {
  children: React.ReactNode
  /** When true, skip the gate (e.g. privacy policy page). */
  allowPublic?: boolean
}

type AuthPageProps = {
  eyebrow: string
  title: string
  description: React.ReactNode
  actions?: React.ReactNode
}

/**
 * Workspace-style page shown when the user must sign in or finish cloud setup.
 *
 * @param props - Page header copy and actions placed with the body text
 *
 * @example
 * <AuthPage
 *   eyebrow="Account"
 *   title="Sign in"
 *   description={<p>Sync across devices.</p>}
 *   actions={<button type="button">Sign in</button>}
 * />
 */
function AuthPage({ eyebrow, title, description, actions }: AuthPageProps) {
  return (
    <div className={workspaceStyles.layout}>
      <WorkspaceNav disabled />

      <main className={workspaceStyles.main}>
        <header className={workspaceStyles.pageHeader}>
          <div className={workspaceStyles.pageTitle}>
            <p className={workspaceStyles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
          </div>
        </header>

        <section className={workspaceStyles.section}>
          <div className={styles.copy}>{description}</div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </section>
      </main>
    </div>
  )
}

/**
 * Replaces route content until the user is signed into Dexie Cloud.
 * Header and Footer stay mounted in the root layout.
 *
 * @param props - Route children and optional public bypass
 *
 * @example
 * <AuthGate>
 *   <Outlet />
 * </AuthGate>
 */
const AuthGate = ({ children, allowPublic = false }: AuthGateProps) => {
  const { configured, isLoggedIn, login } = useCloudAuth()

  if (allowPublic || isLoggedIn) {
    return <>{children}</>
  }

  if (!configured) {
    return (
      <AuthPage
        eyebrow="Setup"
        title="Cloud sync not configured"
        description={
          <p>
            Run <code>npx dexie-cloud create</code>, then set{' '}
            <code>VITE_DEXIE_CLOUD_URL</code> in <code>.env</code> or{' '}
            <code>.env.local</code> and restart the dev server.
          </p>
        }
        actions={
          <Link to="/privacy" className={workspaceStyles.linkBtn}>
            Privacy policy
          </Link>
        }
      />
    )
  }

  return (
    <AuthPage
      eyebrow="Account"
      title="Sign in"
      description={
        <p>
          Create an account or sign in to sync meal plans and recipes across
          your devices.
        </p>
      }
      actions={
        <>
          <button
            type="button"
            className={workspaceStyles.primaryBtn}
            onClick={() => void login()}
          >
            Sign in
          </button>
          <Link to="/privacy" className={workspaceStyles.linkBtn}>
            Privacy policy
          </Link>
        </>
      }
    />
  )
}

export default AuthGate
