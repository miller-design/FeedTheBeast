import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'

import AuthGate from '#/components/AuthGate'
import CloudAuthPanel from '#/components/CloudAuthPanel'
import Footer from '#/components/Footer'
import Header from '#/components/Header'

import mainCss from '../main.css?url'

const themeInitScript = `
(function() {
  var stored = localStorage.getItem('feedthebeast-theme');
  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'FeedTheBeast — Meal Planner' },
    ],
    links: [{ rel: 'stylesheet', href: mainCss }],
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

  return (
    <>
      <Header />
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
