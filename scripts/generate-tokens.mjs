/**
 * Generate src/client/styles/tokens.css from the official @catppuccin/palette package.
 * Run: pnpm generate-tokens
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flavors } from '@catppuccin/palette'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(__dirname, '../src/client/styles/tokens.css')

const { mocha, latte } = flavors
const m = mocha.colors
const l = latte.colors

// light-dark(light, dark) — latte first, mocha second
const ld = (light, dark) => `light-dark(${light}, ${dark})`

const css = `/* =================================================================
   bd-hub Design Tokens
   Generated from @catppuccin/palette — do not edit by hand.
   Run: pnpm generate-tokens
   Dark  → Catppuccin Mocha
   Light → Catppuccin Latte
   Uses CSS light-dark() with color-scheme: light dark
   ================================================================= */

:root {
  color-scheme: light dark;

  /* Backgrounds */
  --bd-color-bg-base:    ${ld(l.mantle.hex, m.base.hex)};
  --bd-color-bg-mantle:  ${ld(l.crust.hex, m.mantle.hex)};
  --bd-color-bg-surface: ${ld(l.base.hex, m.surface0.hex)};

  /* Borders */
  --bd-color-border:       ${ld(l.surface0.hex, m.surface0.hex)};
  --bd-color-border-muted: ${ld(l.surface1.hex, m.surface1.hex)};

  /* Text */
  --bd-color-text-primary:   ${ld(l.text.hex, m.text.hex)};
  --bd-color-text-muted:     ${ld(l.subtext0.hex, m.subtext0.hex)};
  --bd-color-text-on-accent: ${ld(l.base.hex, m.base.hex)};

  /* Column accents */
  --bd-color-accent-in-progress: ${ld(l.blue.hex, m.blue.hex)};
  --bd-color-accent-done:        ${ld(l.green.hex, m.green.hex)};

  /* Priority chip backgrounds */
  --bd-color-priority-p0: ${ld(l.red.hex, m.red.hex)};
  --bd-color-priority-p1: ${ld(l.peach.hex, m.peach.hex)};
  --bd-color-priority-p2: ${ld(l.yellow.hex, m.yellow.hex)};
  --bd-color-priority-p3: ${ld(l.green.hex, m.green.hex)};

  /* Shadows */
  --bd-shadow-card: light-dark(
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.4)
  );
}
`

writeFileSync(outFile, css, 'utf8')
console.log(`✓ tokens.css generated from @catppuccin/palette (mocha + latte)`)
console.log(`  → ${outFile}`)
