import { atom } from 'jotai'

/**
 * Global site readiness gate used by the full-screen splash loader.
 *
 * When `true`, the app shell is mounted and basic readiness signals (fonts + document load)
 * have fired, so we can transition the splash out smoothly.
 */
export const siteReadyAtom = atom(false)

/**
 * Whether the mobile workspace nav drawer (burger menu) is open.
 * Used below `--bp-xl` where the persistent sidebar is hidden.
 */
export const mobileNavOpenAtom = atom(false)

