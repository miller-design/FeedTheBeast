/**
 * Formats an ISO date string (YYYY-MM-DD) for display.
 *
 * @param isoDate - Date string e.g. `"2026-07-22"`
 * @param options - Intl.DateTimeFormat options override
 * @returns Localised date label e.g. `"Tue 22 Jul"`
 *
 * @example
 * formatPlanDate('2026-07-22') // "Tue 22 Jul"
 */
export function formatPlanDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  },
): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, options)
}

/**
 * Returns an array of ISO date strings starting from a given date.
 *
 * @param startDate - ISO date string e.g. `"2026-07-22"`
 * @param count - Number of consecutive days to generate
 * @returns Array of ISO date strings
 *
 * @example
 * generateDateRange('2026-07-22', 3)
 * // ['2026-07-22', '2026-07-23', '2026-07-24']
 */
export function generateDateRange(startDate: string, count: number): string[] {
  const [year, month, day] = startDate.split('-').map(Number)
  const start = new Date(year, month - 1, day)

  return Array.from({ length: count }, (_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    return toIsoDate(current)
  })
}

/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD).
 *
 * @param date - JavaScript Date instance
 * @returns ISO date string
 *
 * @example
 * toIsoDate(new Date(2026, 6, 22)) // "2026-07-22"
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's date as an ISO string for form defaults */
export function todayIsoDate(): string {
  return toIsoDate(new Date())
}
