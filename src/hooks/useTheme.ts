import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'feedthebeast-theme'

/**
 * Reads the stored theme preference from localStorage.
 *
 * @returns Saved theme or null if unset
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

/**
 * Applies a theme to the document root element.
 *
 * @param theme - Theme to apply (`'light'` or `'dark'`)
 *
 * @example
 * applyTheme('dark')
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Hook for toggling between light and dark themes.
 * Persists preference to localStorage.
 *
 * @returns Current theme and toggle function
 *
 * @example
 * const { theme, toggleTheme } = useTheme()
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? 'dark')

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  /**
   * Switches between light and dark mode.
   */
  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme, setTheme }
}
