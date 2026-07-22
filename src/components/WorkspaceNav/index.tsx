import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'

import styles from './styles.module.css'

const NAV_ITEMS = [
  { label: 'My Plans', to: '/' as const },
  { label: 'Recipes', to: '/recipes' as const },
] as const

/**
 * Left sidebar workspace navigation inspired by Nutricalc.
 *
 * @example
 * <WorkspaceNav />
 */
const WorkspaceNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className={styles.root} aria-label="Workspace">
      <p className={styles.label}>Workspace</p>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/'
              ? pathname === '/'
              : pathname.startsWith(item.to)

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={clsx(styles.link, isActive && styles.active)}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default WorkspaceNav
