import { createFileRoute } from '@tanstack/react-router'

import { SITE_NAME } from '#/lib/const'

import styles from './styles.module.css'

export const Route = createFileRoute('/privacy/')({
  head: () => ({
    meta: [{ title: `Privacy Policy — ${SITE_NAME}` }],
  }),
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  const lastUpdated = '22 July 2026'

  return (
    <main className={styles.page}>
      <article className={styles.content}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: {lastUpdated}</p>
        </header>

        <section className={styles.section}>
          <h2>Overview</h2>
          <p>
            {SITE_NAME} is a free meal-planning tool. We do not require an account, we do not
            sell your data, and we do not use analytics or advertising trackers.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we collect</h2>
          <p>
            We do not collect personal information on our servers. Everything you create in the
            app — meal plans, saved meals, recipes, and nutrition entries — is stored locally in
            your browser using IndexedDB. It never leaves your device unless you choose to use
            the features described below.
          </p>
          <p>
            We also store your light/dark theme preference in your browser&apos;s local storage so
            the app remembers your choice on future visits.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we do not do</h2>
          <ul>
            <li>No user accounts or sign-in</li>
            <li>No analytics, cookies, or tracking pixels</li>
            <li>No advertising or profiling</li>
            <li>No server-side database of your meal plans or recipes</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>When you use optional online features</h2>
          <p>
            Some features need a short-lived request through our server because browsers cannot
            call certain external sites directly:
          </p>
          <ul>
            <li>
              <strong>Food search</strong> — Your search terms are sent to our server, which
              queries the{' '}
              <a href="https://world.openfoodfacts.org/" rel="noopener noreferrer">
                Open Food Facts
              </a>{' '}
              API. We do not store search queries after the request completes.
            </li>
            <li>
              <strong>Recipe import</strong> — The recipe URL you provide is fetched by our
              server so we can read structured recipe data from the page. We do not store the URL
              or page content after the import finishes.
            </li>
          </ul>
          <p>
            Third-party sites reached through these features have their own privacy policies. We
            do not control how they handle data.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Deleting your data</h2>
          <p>
            Because your data lives in your browser, you can remove it at any time by clearing
            site data for {SITE_NAME} in your browser settings, or by deleting individual plans
            and recipes inside the app.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Children</h2>
          <p>
            {SITE_NAME} is a general-purpose tool and is not directed at children under 13. We do
            not knowingly collect personal information from anyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Changes to this policy</h2>
          <p>
            If we change how the app handles data, we will update this page and revise the
            &ldquo;Last updated&rdquo; date above.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Contact</h2>
          <p>
            Questions about this policy? Open an issue on the project repository or contact the
            site maintainer through the channel listed on the project homepage.
          </p>
        </section>
      </article>
    </main>
  )
}
