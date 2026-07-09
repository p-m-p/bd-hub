// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { prismTokens } from '../../src/client/styles/prism-tokens.js'
import { PRISM_COLOR_KEYS } from '../../src/server/theme.js'

describe('prism token stylesheet', () => {
  it('themes every prism color key through a light-dark() override var', () => {
    const css = prismTokens.cssText
    for (const suffix of Object.values(PRISM_COLOR_KEYS)) {
      expect(css).toContain(`--bd-theme-prism-light-${suffix}`)
      expect(css).toContain(`--bd-theme-prism-dark-${suffix}`)
    }
  })

  it('uses the bundled Catppuccin palette as fallbacks', () => {
    const css = prismTokens.cssText
    expect(css).toContain('var(--bd-theme-prism-light-keyword, #8839ef)')
    expect(css).toContain('var(--bd-theme-prism-dark-keyword, #cba6f7)')
    expect(css).toContain('var(--bd-theme-prism-dark-background, #181825)')
    expect(css).toContain('var(--bd-theme-prism-dark-text, #cdd6f4)')
  })

  it('styles the prism token classes', () => {
    const css = prismTokens.cssText
    expect(css).toContain('.token.class-name')
    expect(css).toContain('.token.attr-name')
    expect(css).toMatch(/\.token\.italic\s*{\s*font-style: italic/)
  })
})
