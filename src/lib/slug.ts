/**
 * Converts a display name into a URL-safe slug.
 *
 * @param name - Human-readable label e.g. `"Week 1 Cut"`
 * @returns Lowercase hyphenated slug e.g. `"week-1-cut"`
 *
 * @example
 * slugify('Week 1 Cut') // "week-1-cut"
 * slugify('  Hello!!! World  ') // "hello-world"
 */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'plan'
}

/**
 * Picks a slug that is not already taken, appending `-2`, `-3`, … on collision.
 *
 * @param base - Preferred slug from `slugify`
 * @param existingSlugs - Slugs already in use (case-sensitive match against `base` variants)
 * @returns Unique slug suitable for storage and routing
 *
 * @example
 * ensureUniquePlanSlug('week-1', ['week-1']) // "week-1-2"
 * ensureUniquePlanSlug('week-1', []) // "week-1"
 */
export function ensureUniquePlanSlug(
  base: string,
  existingSlugs: Iterable<string>,
): string {
  const taken = new Set(existingSlugs)
  if (!taken.has(base)) {
    return base
  }

  let n = 2
  while (taken.has(`${base}-${n}`)) {
    n += 1
  }
  return `${base}-${n}`
}
