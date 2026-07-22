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
            {SITE_NAME} is a free meal-planning tool. An account is required so your plans and
            recipes can sync across devices. We do not sell your data, and we do not use analytics
            or advertising trackers.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we collect</h2>
          <p>
            When you sign in, we process the email address you use for passwordless (one-time code)
            authentication through{' '}
            <a href="https://dexie.org/cloud" rel="noopener noreferrer">
              Dexie Cloud
            </a>
            .
          </p>
          <p>
            Meal plans, saved meals, recipes, and nutrition entries are stored in your browser
            (IndexedDB) and synced to Dexie Cloud so you can use {SITE_NAME} on multiple devices.
            Your light/dark theme preference stays in local storage on each device.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we do not do</h2>
          <ul>
            <li>No analytics, cookies, or tracking pixels</li>
            <li>No advertising or profiling</li>
            <li>We do not sell your personal data</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Sync and account</h2>
          <p>
            Sync is part of the product: after you sign in, your meal-planning data is replicated
            through Dexie Cloud&apos;s hosted service under their terms and privacy practices, in
            addition to this policy.
          </p>
          <p>
            You can sign out from the header on any device. Signing out stops sync on that device;
            data already on other signed-in devices is unchanged until you delete it there or in
            the app.
          </p>
        </section>

        <section className={styles.section}>
          <h2>When you use food search or recipe import</h2>
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
            Delete individual plans and recipes inside the app. You can also clear site data for{' '}
            {SITE_NAME} in your browser settings to remove the local cache on that device. To
            remove synced cloud data associated with your account, contact the site maintainer or
            use Dexie Cloud account controls if available for your database.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Children</h2>
          <p>
            {SITE_NAME} is a general-purpose tool and is not directed at children under 13. We do
            not knowingly collect personal information from children.
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
