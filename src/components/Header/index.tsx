import { Link } from '@tanstack/react-router'

import ThemeToggle from '#/components/ThemeToggle'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import { useUserProfile } from '#/hooks/useUserProfile'
import { SITE_NAME } from '#/lib/const'

import styles from './styles.module.css'

/**
 * Site header with logo, account shortcut, and theme toggle.
 *
 * @example
 * <Header />
 */
const Header = () => {
  const { configured, isLoggedIn, user, syncLabel, login, logout } = useCloudAuth()
  const { profile } = useUserProfile()

  const accountLabel =
    profile?.displayName || profile?.username || user.email || user.name || 'Account'

  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <Link to="/" className={styles.logo}>
          {SITE_NAME}
        </Link>
        <div className={styles.actions}>
          {configured && isLoggedIn ? (
            <>
              {syncLabel ? <span className={styles.sync}>{syncLabel}</span> : null}
              <Link to="/account" className={styles.accountLink} title={user.email ?? undefined}>
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
            <button type="button" className={styles.authButton} onClick={() => void login()}>
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
