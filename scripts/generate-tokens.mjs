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

const version = mocha.name // 'Mocha' — version comes from package.json

const css = `/* =================================================================
   bd-hub Design Tokens
   Generated from @catppuccin/palette — do not edit by hand.
   Run: pnpm generate-tokens
   Dark  → Catppuccin Mocha
   Light → Catppuccin Latte  (applied via prefers-color-scheme)
   ================================================================= */

/* Dark theme — Catppuccin Mocha (default) */
:root {
  /* Backgrounds */
  --bd-color-bg-base:    ${m.base.hex};
  --bd-color-bg-mantle:  ${m.mantle.hex};
  --bd-color-bg-surface: ${m.surface0.hex};

  /* Borders */
  --bd-color-border:       ${m.surface0.hex};
  --bd-color-border-muted: ${m.surface1.hex};

  /* Text */
  --bd-color-text-primary:   ${m.text.hex};
  --bd-color-text-muted:     ${m.subtext0.hex};
  --bd-color-text-on-accent: ${m.base.hex};

  /* Column accents */
  --bd-color-accent-in-progress: ${m.blue.hex};
  --bd-color-accent-done:        ${m.green.hex};

  /* Priority chip backgrounds */
  --bd-color-priority-p0: ${m.red.hex};
  --bd-color-priority-p1: ${m.peach.hex};
  --bd-color-priority-p2: ${m.yellow.hex};
  --bd-color-priority-p3: ${m.green.hex};

  /* Shadows */
  --bd-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Light theme — Catppuccin Latte */
@media (prefers-color-scheme: light) {
  :root {
    /* Backgrounds */
    --bd-color-bg-base:    ${l.base.hex};
    --bd-color-bg-mantle:  ${l.mantle.hex};
    --bd-color-bg-surface: ${l.surface0.hex};

    /* Borders */
    --bd-color-border:       ${l.surface0.hex};
    --bd-color-border-muted: ${l.surface1.hex};

    /* Text */
    --bd-color-text-primary:   ${l.text.hex};
    --bd-color-text-muted:     ${l.subtext0.hex};
    --bd-color-text-on-accent: ${l.base.hex};

    /* Column accents */
    --bd-color-accent-in-progress: ${l.blue.hex};
    --bd-color-accent-done:        ${l.green.hex};

    /* Priority chip backgrounds */
    --bd-color-priority-p0: ${l.red.hex};
    --bd-color-priority-p1: ${l.peach.hex};
    --bd-color-priority-p2: ${l.yellow.hex};
    --bd-color-priority-p3: ${l.green.hex};

    /* Shadows */
    --bd-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08);
  }
}
`

writeFileSync(outFile, css, 'utf8')
console.log(`✓ tokens.css generated from @catppuccin/palette (mocha + latte)`)
console.log(`  → ${outFile}`)
