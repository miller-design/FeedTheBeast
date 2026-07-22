import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import mainCss from '../main.css?url'
import Header from '#/components/Header'
import Footer from '#/components/Footer'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TOO Playground',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: mainCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
