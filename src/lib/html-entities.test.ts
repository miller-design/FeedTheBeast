import { describe, expect, it } from 'vitest'

import { decodeHtmlEntities } from '#/lib/html-entities'

describe('decodeHtmlEntities', () => {
  it('decodes numeric and named entities used in recipe imports', () => {
    expect(decodeHtmlEntities("You&#8217;re welcome")).toBe("You’re welcome")
    expect(decodeHtmlEntities('1/4 &#8211; 1/2 cup')).toBe('1/4 – 1/2 cup')
    expect(decodeHtmlEntities('salt &amp; pepper')).toBe('salt & pepper')
  })

  it('leaves plain text unchanged', () => {
    expect(decodeHtmlEntities('2 cloves garlic')).toBe('2 cloves garlic')
  })
})
