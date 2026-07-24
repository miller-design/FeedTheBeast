import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'

import { NAV_ITEMS } from '#/components/WorkspaceNav'
import { mobileNavOpenAtom } from '#/store/global'

import type { MobileNavDrawerProps } from './types'
import styles from './styles.module.css'

/** Matches SlidePanel exit timing (`0.4s ease`). */
const EXIT_ANIMATION_MS = 400

/**
 * Left-side burger nav overlay for viewports below `--bp-xl`.
 * Fade/slide timing mirrors SlidePanel (`0.4s ease`).
 *
 * @param props.disabled - Renders items as disabled text instead of links
 *
 * @example
 * <MobileNavDrawer />
 * <MobileNavDrawer disabled />
 */
const MobileNavDrawer = ({ disabled = false }: MobileNavDrawerProps) => {
  const [open, setOpen] = useAtom(mobileNavOpenAtom)
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    if (!open) return
    setMounted(true)
  }, [open])

  useEffect(() => {
    if (!mounted) return

    if (!open) {
      setEntered(false)

      const exitTimer = window.setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, EXIT_ANIMATION_MS)

      return () => {
        window.clearTimeout(exitTimer)
      }
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    document.body.style.overflow = 'hidden'

    /**
     * Closes the drawer when the user presses Escape.
     *
     * @param event - Native keyboard event from the document
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mounted, open, setOpen])

  useEffect(() => {
    if (mounted) return
    document.body.style.overflow = ''
  }, [mounted])

  /**
   * Closes the drawer after a route change so the overlay does not linger.
   */
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  /**
   * Closes the nav when the viewport grows into the persistent sidebar range.
   */
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)')

    /**
     * Clears open state at desktop widths.
     */
    function handleChange() {
      if (media.matches) setOpen(false)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [setOpen])

  if (!mounted) return null

  return (
    <>
      <div
        className={clsx(styles.overlay, entered && styles.overlayVisible)}
        onClick={() => setOpen(false)}
        role="presentation"
      />
      <aside
        className={clsx(styles.panel, entered && styles.panelVisible)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
        id="mobile-workspace-nav"
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Workspace</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </header>

        <nav
          className={styles.body}
          aria-label="Workspace"
          aria-disabled={disabled || undefined}
        >
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
                    <span
                      className={clsx(styles.link, styles.disabled)}
                      aria-disabled="true"
                    >
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
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default MobileNavDrawer
