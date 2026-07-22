import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'

import styles from './styles.module.css'

type DeleteAccountPanelProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  busy: boolean
  error: string | null
}

/**
 * Confirmation slide panel for permanently deleting the cloud account.
 *
 * @param props.open - Whether the panel is visible
 * @param props.onClose - Close handler
 * @param props.onConfirm - Runs account deletion
 * @param props.busy - Disables actions while deleting
 * @param props.error - Optional error message
 *
 * @example
 * <DeleteAccountPanel open onClose={() => {}} onConfirm={async () => {}} busy={false} error={null} />
 */
const DeleteAccountPanel = ({
  open,
  onClose,
  onConfirm,
  busy,
  error,
}: DeleteAccountPanelProps) => {
  return (
    <SlidePanel
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Delete account"
      subtitle="This permanently removes your FeedTheBeast cloud account and synced meal data."
      titleId="delete-account-title"
      footer={
        <>
          <button
            type="button"
            className={panelStyles.cancelBtn}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? 'Deleting…' : 'Delete account'}
          </button>
        </>
      }
    >
      <div className={styles.body}>
        <p>
          Plans, recipes, and profile details synced to this account will be erased. This cannot
          be undone.
        </p>
        {error ? <p className={panelStyles.error}>{error}</p> : null}
      </div>
    </SlidePanel>
  )
}

export default DeleteAccountPanel
