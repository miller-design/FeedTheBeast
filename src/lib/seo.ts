/**
 * Shared SEO helpers for route `head` config: titles, descriptions, and Open Graph tags.
 *
 * Set `VITE_SITE_URL` (no trailing slash) so canonical/OG URLs resolve correctly in production.
 *
 * @example
 * // Root defaults
 * head: () => buildSeoHead()
 *
 * @example
 * // Nested page overrides title + description
 * head: () =>
 *   buildSeoHead({
 *     title: pageTitle('Recipes'),
 *     description: 'Save and organise recipes for your meal plans.',
 *     path: '/recipes',
 *   })
 */

import { SITE_NAME, SITE_TAGLINE } from '#/lib/const'

export const SITE_DESCRIPTION =
  'Plan meals, track macros, and build a recipe library. FeedTheBeast is a free meal planner with calorie targets, shopping lists, and cloud sync.'

/** Production origin without trailing slash, e.g. `https://feedthebeast.app`. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '')

export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`

/** Public paths included in `/sitemap.xml` (auth-gated routes omitted). */
export const SITEMAP_PATHS = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/privacy', changefreq: 'monthly', priority: 0.4 },
] as const

export type SeoHeadOptions = {
  /** Full document title (use `pageTitle()` for nested pages). */
  title?: string
  /** Meta description; falls back to the site default. */
  description?: string
  /** Pathname for canonical/og:url, e.g. `/privacy`. */
  path?: string
  /** When true, adds robots noindex,nofollow (auth-only pages). */
  noIndex?: boolean
}

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { charSet: string }

type LinkTag = {
  rel: string
  href: string
  type?: string
  sizes?: string
}

export type SeoHeadResult = {
  meta: MetaTag[]
  links: LinkTag[]
}

/**
 * Builds a document title as `Page — Site` or the default brand title.
 *
 * @param page - Optional page label, e.g. `"Recipes"`
 * @returns Title string for `<title>` / og:title
 *
 * @example
 * pageTitle() // 'FeedTheBeast — Meal Planner'
 * pageTitle('Privacy Policy') // 'Privacy Policy — FeedTheBeast'
 */
export function pageTitle(page?: string): string {
  if (!page) return `${SITE_NAME} — ${SITE_TAGLINE}`
  return `${page} — ${SITE_NAME}`
}

/**
 * Resolves an absolute site URL for a path when `VITE_SITE_URL` is set.
 *
 * @param path - Pathname starting with `/`, or empty for the origin
 * @returns Absolute URL, or the path alone when no origin is configured
 *
 * @example
 * absoluteUrl('/privacy') // 'https://example.com/privacy' when VITE_SITE_URL is set
 */
export function absoluteUrl(path = '/'): string {
  const normalised = path.startsWith('/') ? path : `/${path}`
  if (!SITE_URL) return normalised
  return normalised === '/' ? SITE_URL : `${SITE_URL}${normalised}`
}

/**
 * Resolves the public site origin for sitemap/robots responses.
 * Prefers `VITE_SITE_URL`, then the incoming request origin.
 *
 * @param request - Incoming HTTP request (used when env is unset)
 * @returns Origin without trailing slash
 *
 * @example
 * resolveSiteOrigin(request) // 'https://feedthebeast.app'
 */
export function resolveSiteOrigin(request: Request): string {
  if (SITE_URL) return SITE_URL
  return new URL(request.url).origin
}

/**
 * Builds TanStack Router `head` meta + link tags for SEO and social previews.
 *
 * @param options - Optional title, description, path, and noIndex overrides
 * @returns Object suitable for `createFileRoute({ head: () => … })`
 *
 * @example
 * createFileRoute('/recipes/')({
 *   head: () =>
 *     buildSeoHead({
 *       title: pageTitle('Recipes'),
 *       description: 'Browse and manage your recipe library.',
 *       path: '/recipes',
 *     }),
 * })
 */
export function buildSeoHead(options: SeoHeadOptions = {}): SeoHeadResult {
  const title = options.title ?? pageTitle()
  const description = options.description ?? SITE_DESCRIPTION
  const path = options.path ?? '/'
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(OG_IMAGE_PATH)

  const meta: MetaTag[] = [
    { title },
    { name: 'description', content: description },
    { name: 'application-name', content: SITE_NAME },
    { name: 'theme-color', content: '#0a0a0a' },
    { name: 'color-scheme', content: 'dark light' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:alt', content: OG_IMAGE_ALT },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: OG_IMAGE_ALT },
  ]

  if (SITE_URL) {
    meta.push({ property: 'og:url', content: url })
  }

  if (options.noIndex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' })
  }

  const links: LinkTag[] = [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/logo192.png' },
    { rel: 'manifest', href: '/manifest.json' },
  ]

  if (SITE_URL) {
    links.push({ rel: 'canonical', href: url })
  }

  return { meta, links }
}
