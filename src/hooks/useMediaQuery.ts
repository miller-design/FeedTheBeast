import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 *
 * @param query - Media query string e.g. `"(min-width: 1280px)"`
 * @returns `true` when the query matches
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1280px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)

    /**
     * Syncs React state when the media query result changes.
     */
    function sync() {
      setMatches(media.matches)
    }

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [query])

  return matches
}
