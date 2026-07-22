import { useEffect, useId, useState } from 'react'
import { useObservable } from 'dexie-react-hooks'
import type { DXCAlert, DXCUserInteraction } from 'dexie-cloud-addon'

import SlidePanel from '#/components/SlidePanel'
import panelStyles from '#/components/SlidePanel/panel.module.css'
import { useCloudAuth } from '#/hooks/useCloudAuth'
import { db, isCloudConfigured } from '#/lib/db'

import styles from './styles.module.css'

const FORM_ID = 'cloud-auth-form'

/**
 * Renders Dexie Cloud login / OTP / logout prompts inside the shared SlidePanel.
 *
 * Dexie clears `userInteraction` immediately on submit before the next step
 * arrives, so this component keeps the last prompt visible until the next
 * interaction is published or sign-in succeeds.
 *
 * @example
 * // Mount once in the root layout:
 * <CloudAuthPanel />
 */
const CloudAuthPanel = () => {
  const configured = isCloudConfigured()
  const { isLoggedIn } = useCloudAuth()
  const interaction = useObservable(() => db.cloud.userInteraction)

  const [prompt, setPrompt] = useState<DXCUserInteraction | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const formId = useId()
  const resolvedFormId = `${FORM_ID}-${formId}`

  useEffect(() => {
    if (!interaction) return

    setPrompt(interaction)
    setSubmitting(false)

    const next: Record<string, string> = {}
    for (const name of Object.keys(interaction.fields ?? {})) {
      next[name] = ''
    }
    setValues(next)
  }, [interaction])

  useEffect(() => {
    if (!isLoggedIn) return
    setPrompt(null)
    setSubmitting(false)
    setValues({})
  }, [isLoggedIn])

  if (!configured || !prompt || isLoggedIn) {
    return null
  }

  const activePrompt = prompt
  const fieldNames = Object.keys(activePrompt.fields ?? {})
  const fields = activePrompt.fields ?? {}

  /**
   * Updates a single field value from an input change.
   *
   * @param name - Field key from the Dexie interaction
   * @param value - Current input value
   */
  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Submits field values without closing the panel. Dexie clears the live
   * interaction on submit; we keep `prompt` until the next step or login.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    activePrompt.onSubmit(values)
  }

  /**
   * Cancels the flow and closes the panel. Ignored while a submit is in flight
   * so the panel stays open through email → OTP until sign-in succeeds.
   */
  function handleClose() {
    if (submitting) return

    activePrompt.onCancel()
    setPrompt(null)
    setSubmitting(false)
    setValues({})
  }

  /**
   * Submits a selectable option (e.g. OAuth provider) without closing early.
   *
   * @param name - Option field name
   * @param value - Option value
   */
  function handleOption(name: string, value: string) {
    if (submitting) return
    setSubmitting(true)
    activePrompt.onSubmit({ [name]: value })
  }

  const canSubmit =
    !submitting &&
    (fieldNames.length === 0 ||
      fieldNames.every((name) => (values[name] ?? '').trim().length > 0))

  return (
    <SlidePanel
      open
      onClose={handleClose}
      title={activePrompt.title}
      titleId="cloud-auth-title"
    >
      <form id={resolvedFormId} onSubmit={handleSubmit} className={panelStyles.form}>
        {activePrompt.alerts.length > 0 ? (
          <ul className={styles.alerts}>
            {activePrompt.alerts.map((alert, index) => (
              <li key={`${alert.messageCode}-${index}`} className={alertClassName(alert)}>
                {formatAlertMessage(alert)}
              </li>
            ))}
          </ul>
        ) : null}

        {'options' in activePrompt &&
        activePrompt.options &&
        activePrompt.options.length > 0 ? (
          <div className={styles.options}>
            {activePrompt.options.map((option) => (
              <button
                key={`${option.name}-${option.value}`}
                type="button"
                className={panelStyles.tertiaryBtn}
                disabled={submitting}
                onClick={() => handleOption(option.name, option.value)}
              >
                {option.displayName}
              </button>
            ))}
          </div>
        ) : null}

        {fieldNames.map((name) => {
          const field = fields[name]
          if (!field) return null

          return (
            <label key={name} className={panelStyles.field}>
              <span>{field.label ?? labelForField(name, activePrompt.type)}</span>
              <input
                type={inputTypeForField(field.type)}
                name={name}
                value={values[name] ?? ''}
                placeholder={field.placeholder}
                autoComplete={name === 'email' ? 'email' : name === 'otp' ? 'one-time-code' : 'off'}
                autoFocus={name === fieldNames[0]}
                required
                disabled={submitting}
                onChange={(event) => setField(name, event.target.value)}
              />
            </label>
          )
        })}

        <div className={styles.submitRow}>
          <button type="submit" className={panelStyles.submitBtn} disabled={!canSubmit}>
            {submitting ? 'Working…' : activePrompt.submitLabel}
          </button>
          {activePrompt.cancelLabel ? (
            <button
              type="button"
              className={panelStyles.cancelBtn}
              onClick={handleClose}
              disabled={submitting}
            >
              {activePrompt.cancelLabel}
            </button>
          ) : null}
        </div>
      </form>
    </SlidePanel>
  )
}

/**
 * Maps a Dexie field type to an HTML input type.
 *
 * @param type - Dexie Cloud field type
 * @returns HTML input type attribute
 *
 * @example
 * inputTypeForField('otp') // "text"
 */
function inputTypeForField(type: string): string {
  if (type === 'password') return 'password'
  if (type === 'email') return 'email'
  return 'text'
}

/**
 * Fallback label when Dexie does not provide one on the field.
 *
 * @param name - Field key
 * @param interactionType - Current interaction type
 * @returns Human-readable label
 *
 * @example
 * labelForField('email', 'email') // "Email"
 */
function labelForField(name: string, interactionType: string): string {
  if (name === 'email') return 'Email'
  if (name === 'otp') return 'One-time code'
  if (interactionType === 'otp') return 'Code'
  return name
}

/**
 * Interpolates `{param}` placeholders in Dexie alert messages.
 *
 * @param alert - Dexie Cloud alert
 * @returns Display string with params applied
 *
 * @example
 * formatAlertMessage({ message: 'Sent to {email}', messageParams: { email: 'a@b.com' }, ... })
 */
function formatAlertMessage(alert: DXCAlert): string {
  return alert.message.replace(/\{(\w+)\}/g, (_, key: string) => alert.messageParams[key] ?? `{${key}}`)
}

/**
 * Picks an alert style class from the Dexie alert type.
 *
 * @param alert - Dexie Cloud alert
 * @returns CSS module class name
 *
 * @example
 * alertClassName({ type: 'error', messageCode: 'GENERIC_ERROR', message: '...', messageParams: {} })
 */
function alertClassName(alert: DXCAlert): string {
  if (alert.type === 'error') return styles.alertError
  if (alert.type === 'warning') return styles.alertWarning
  return styles.alertInfo
}

export default CloudAuthPanel
