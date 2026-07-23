import { useEffect, useId, useState } from 'react'
import clsx from 'clsx'

import type { SlidePanelProps } from './types'
import styles from './styles.module.css'

const EXIT_ANIMATION_MS = 400

/**
 * Right-side slide-in panel with backdrop, used in place of centred modals.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Called when the user closes the panel
 * @param props.title - Panel heading text
 * @param props.subtitle - Optional description below the title
 * @param props.titleId - Optional ID for aria-labelledby (auto-generated if omitted)
 * @param props.width - Panel width preset (`default` | `wide`)
 * @param props.footer - Optional sticky footer content (e.g. action buttons)
 * @param props.children - Scrollable panel body content
 *
 * @example
 * <SlidePanel open={open} onClose={onClose} title="New recipe" footer={<Actions />}>
 *   <form>...</form>
 * </SlidePanel>
 */
const SlidePanel = ({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  width = 'default',
  footer,
  children,
}: SlidePanelProps) => {
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const generatedId = useId()
  const headingId = titleId ?? generatedId

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
     * Closes the panel when the user presses Escape.
     *
     * @param event - Native keyboard event from the document, for example pressing `Escape`
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mounted, open, onClose])

  useEffect(() => {
    if (mounted) return
    document.body.style.overflow = ''
  }, [mounted])

  if (!mounted) return null

  return (
    <>
      <div
        className={clsx(styles.overlay, entered && styles.overlayVisible)}
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={clsx(
          styles.panel,
          width === 'wide' ? styles.panelWide : styles.panelDefault,
          entered && styles.panelVisible,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </aside>
    </>
  )
}

export default SlidePanel
