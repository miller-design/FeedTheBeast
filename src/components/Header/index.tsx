import { Link } from '@tanstack/react-router'

import ThemeToggle from '#/components/ThemeToggle'
import { SITE_NAME } from '#/lib/const'

import styles from './styles.module.css'

const Header = () => {
  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <Link to="/" className={styles.logo}>
          {SITE_NAME}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

export default Header
