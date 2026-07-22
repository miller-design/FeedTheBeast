import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import mainCss from '../main.css?url'
import Header from '#/components/Header'
import Footer from '#/components/Footer'

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
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
