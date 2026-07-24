import { Link } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import clsx from 'clsx'

import ThemeToggle from '#/components/ThemeToggle'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import { useUserProfile } from '#/hooks/useUserProfile'
import { SITE_NAME } from '#/lib/const'
import { mobileNavOpenAtom } from '#/store/global'

import styles from './styles.module.css'

/**
 * Site header with burger nav (small screens), logo, account, and theme toggle.
 *
 * @example
 * <Header />
 */
const Header = () => {
  const { configured, isLoggedIn, user, syncLabel, login, logout } =
    useCloudAuth()
  const { profile } = useUserProfile()
  const [navOpen, setNavOpen] = useAtom(mobileNavOpenAtom)

  const accountLabel =
    profile?.displayName ||
    profile?.username ||
    user.email ||
    user.name ||
    'Account'

  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <button
            type="button"
            className={styles.burger}
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            aria-controls="mobile-workspace-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className={clsx(styles.burgerBar, navOpen && styles.burgerBarTop)} />
            <span className={clsx(styles.burgerBar, navOpen && styles.burgerBarMid)} />
            <span className={clsx(styles.burgerBar, navOpen && styles.burgerBarBot)} />
          </button>
          <Link to="/" className={styles.logo}>
            {SITE_NAME}
          </Link>
        </div>
        <div className={styles.actions}>
          {configured && isLoggedIn ? (
            <>
              {syncLabel ? (
                <span className={styles.sync}>{syncLabel}</span>
              ) : null}
              <Link
                to="/account"
                className={styles.accountLink}
                title={user.email ?? undefined}
              >
                {accountLabel}
              </Link>
              <button
                type="button"
                className={styles.authButton}
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </>
          ) : configured ? (
            <button
              type="button"
              className={styles.authButton}
              onClick={() => void login()}
            >
              Sign in
            </button>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
