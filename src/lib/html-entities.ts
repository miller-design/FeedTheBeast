const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  trade: '™',
  copy: '©',
  reg: '®',
}

/**
 * Decodes HTML entities in recipe text so imports show real characters.
 * Handles numeric (`&#8217;`, `&#x2019;`) and common named entities (`&amp;`, `&nbsp;`).
 *
 * @param text - Raw string that may contain HTML entities
 * @returns Text with entities replaced by their characters
 *
 * @example
 * decodeHtmlEntities("You&#8217;re welcome") // "You’re welcome"
 * decodeHtmlEntities("1/4 &#8211; 1/2 cup") // "1/4 – 1/2 cup"
 */
export function decodeHtmlEntities(text: string): string {
  if (!text.includes('&')) return text

  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number(dec)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => {
      return NAMED_ENTITIES[name.toLowerCase()] ?? match
    })
}
