import type { ReactNode } from 'react'

export type SlidePanelWidth = 'default' | 'wide'

export type SlidePanelProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  titleId?: string
  /** Panel width preset — use `wide` for content-heavy views like recipe details */
  width?: SlidePanelWidth
  footer?: ReactNode
  children: ReactNode
}
