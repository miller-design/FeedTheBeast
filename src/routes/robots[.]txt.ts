import { createFileRoute } from '@tanstack/react-router'

import { resolveSiteOrigin } from '#/lib/seo'

/**
 * Dynamic robots.txt: allow public pages, block private workspace routes,
 * and point crawlers at `/sitemap.xml`.
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = resolveSiteOrigin(request)
        const body = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /account
Disallow: /plans/

Sitemap: ${origin}/sitemap.xml
`

        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
