type FooterLink = {
  label: string
  href: string
  target?: string
}

export const SITE_NAME = 'FeedTheBeast'
export const FOOTER_COPYRIGHT = `${SITE_NAME}. All rights reserved.`

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
]
