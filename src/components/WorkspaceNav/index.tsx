import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'

import styles from './styles.module.css'

export const NAV_ITEMS = [
  { label: 'Account', to: '/account' as const },
  { label: 'My Plans', to: '/' as const },
  { label: 'Recipes', to: '/recipes' as const },
] as const

type WorkspaceNavProps = {
  /** When true, nav links are non-interactive (e.g. signed-out auth gate). */
  disabled?: boolean
}

/**
 * Left sidebar workspace navigation. Hidden below `--bp-xl` in favour of
 * the burger overlay (`MobileNavDrawer`).
 *
 * @param props.disabled - Renders items as disabled text instead of links
 *
 * @example
 * <WorkspaceNav />
 * <WorkspaceNav disabled />
 */
const WorkspaceNav = ({ disabled = false }: WorkspaceNavProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className={styles.root} aria-label="Workspace" aria-disabled={disabled || undefined}>
      <p className={styles.label}>Workspace</p>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            !disabled &&
            (item.to === '/'
              ? pathname === '/'
              : pathname === item.to || pathname.startsWith(`${item.to}/`))

          if (disabled) {
            return (
              <li key={item.to}>
                <span className={clsx(styles.link, styles.disabled)} aria-disabled="true">
                  {item.label}
                </span>
              </li>
            )
          }

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
