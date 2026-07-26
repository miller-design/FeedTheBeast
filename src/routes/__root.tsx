import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'

import AuthGate from '#/components/AuthGate'
import CloudAuthPanel from '#/components/CloudAuthPanel'
import Footer from '#/components/Footer'
import Header from '#/components/Header'
import MobileNavDrawer from '#/components/MobileNavDrawer'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import { SITE_NAME, SITE_TAGLINE } from '#/lib/const'
import { buildSeoHead, SITE_DESCRIPTION } from '#/lib/seo'

import mainCss from '../main.css?url'

const themeInitScript = `
(function() {
  var stored = localStorage.getItem('feedthebeast-theme');
  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();
`

const defaultSeo = buildSeoHead()

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  alternateName: `${SITE_NAME} ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...defaultSeo.meta,
    ],
    links: [...defaultSeo.links, { rel: 'stylesheet', href: mainCss }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(jsonLd),
      },
    ],
  }),
  component: AppLayout,
  shellComponent: RootDocument,
})

/**
 * Persistent chrome with auth wrapping route content only.
 * Privacy stays readable without signing in.
 */
function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublic = pathname === '/privacy' || pathname === '/privacy/'
  const { isLoggedIn } = useCloudAuth()

  return (
    <>
      <Header />
      <MobileNavDrawer disabled={!isLoggedIn && !isPublic} />
      <AuthGate allowPublic={isPublic}>
        <Outlet />
      </AuthGate>
      <Footer />
      <CloudAuthPanel />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
