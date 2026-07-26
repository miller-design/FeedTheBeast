import { createFileRoute } from '@tanstack/react-router'

import { resolveSiteOrigin, SITEMAP_PATHS } from '#/lib/seo'

/**
 * Dynamic sitemap for public indexable routes.
 * Uses `VITE_SITE_URL` when set, otherwise the request origin.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = resolveSiteOrigin(request)
        const urls = SITEMAP_PATHS.map(
          ({ path, changefreq, priority }) => `  <url>
    <loc>${origin}${path === '/' ? '/' : path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
        ).join('\n')

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
