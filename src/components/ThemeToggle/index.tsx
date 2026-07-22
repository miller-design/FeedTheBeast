import { useTheme } from '#/hooks/useTheme'

import styles from './styles.module.css'

/**
 * Toggle button for switching between light and dark themes.
 *
 * @example
 * <ThemeToggle />
 */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className={styles.root}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

export default ThemeToggle
