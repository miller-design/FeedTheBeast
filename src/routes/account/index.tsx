import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import DeleteAccountPanel from '#/components/DeleteAccountPanel'
import WorkspaceNav from '#/components/WorkspaceNav'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import { useUserProfile } from '#/hooks/useUserProfile'
import { deleteCurrentAccount } from '#/lib/cloud/account'
import panelStyles from '#/components/SlidePanel/panel.module.css'

import workspaceStyles from '#/styles/workspace-page.module.css'
import styles from './styles.module.css'

export const Route = createFileRoute('/account/')({
  head: () => ({
    meta: [{ title: 'Account — FeedTheBeast' }],
  }),
  component: AccountPage,
})

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/

/**
 * Account settings: profile fields, session info, sign out, and account deletion.
 */
function AccountPage() {
  const navigate = useNavigate()
  const { user, syncLabel } = useCloudAuth()
  const { profile, save } = useUserProfile()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      setUsername('')
      setDisplayName('')
      return
    }
    setUsername(profile.username)
    setDisplayName(profile.displayName)
  }, [profile])

  /**
   * Validates and saves profile fields to the synced profiles table.
   *
   * @param event - Form submit event
   */
  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaveError(null)
    setSaveOk(false)

    const trimmedUsername = username.trim()
    const trimmedDisplayName = displayName.trim()

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setSaveError('Username must be 3–24 characters: letters, numbers, or underscores.')
      return
    }

    if (!trimmedDisplayName) {
      setSaveError('Display name is required.')
      return
    }

    setSaving(true)
    try {
      await save({ username: trimmedUsername, displayName: trimmedDisplayName })
      setSaveOk(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Deletes the cloud account after confirmation.
   */
  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteCurrentAccount()
    setDeleting(false)

    if (!result.success) {
      setDeleteError(result.error)
      return
    }

    setDeleteOpen(false)
    void navigate({ to: '/' })
  }

  return (
    <div className={workspaceStyles.layout}>
      <WorkspaceNav />

      <main className={workspaceStyles.main}>
        <header className={workspaceStyles.pageHeader}>
          <div className={workspaceStyles.pageTitle}>
            <p className={workspaceStyles.eyebrow}>Settings</p>
            <h1>Account</h1>
          </div>
          <div className={workspaceStyles.pageActions}>
            <button
              type="submit"
              form="account-profile-form"
              className={workspaceStyles.primaryBtn}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </header>

        <div className={styles.stack}>
          <section className={workspaceStyles.section}>
            <h2 className={workspaceStyles.sectionTitle}>Profile</h2>

            <form
              id="account-profile-form"
              className={styles.form}
              onSubmit={(event) => void handleSave(event)}
            >
              <label className={styles.field}>
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setSaveOk(false)
                  }}
                  placeholder="e.g. jack_m"
                  autoComplete="username"
                  maxLength={24}
                />
              </label>

              <label className={styles.field}>
                <span>Display name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value)
                    setSaveOk(false)
                  }}
                  placeholder="e.g. Jack"
                  autoComplete="nickname"
                  maxLength={60}
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input type="email" value={user.email ?? user.userId ?? ''} readOnly disabled />
              </label>

              {saveError ? <p className={panelStyles.error}>{saveError}</p> : null}
              {saveOk ? <p className={styles.success}>Profile saved.</p> : null}
            </form>
          </section>

          <section className={workspaceStyles.section}>
            <h2 className={workspaceStyles.sectionTitle}>Session</h2>
            <div className={styles.metaCard}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Sync</span>
                <span className={styles.metaValue}>{syncLabel || 'Idle'}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Signed in as</span>
                <span className={styles.metaValue}>{user.email ?? user.userId ?? '—'}</span>
              </div>
            </div>
          </section>

          <section className={styles.dangerZone}>
            <h2 className={styles.dangerTitle}>Danger zone</h2>
            <p className={styles.dangerCopy}>
              Delete your account to erase synced plans, recipes, and profile data from Dexie
              Cloud. This cannot be undone.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => {
                  setDeleteError(null)
                  setDeleteOpen(true)
                }}
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </main>

      <DeleteAccountPanel
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        busy={deleting}
        error={deleteError}
      />
    </div>
  )
}
