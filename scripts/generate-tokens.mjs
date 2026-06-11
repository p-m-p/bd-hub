/**
 * Generate src/client/styles/tokens.css from the official @catppuccin/palette package.
 * Run: pnpm generate-tokens
 *
 * Every token reads a `--bd-theme-*` override var with the Catppuccin value as
 * fallback. The server emits only the overrides the user set in
 * bd-hub.config.json at /theme.css, so theming never depends on stylesheet
 * load order and defaults live only in this file.
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

// Themeable color token: light-dark() with per-scheme override vars.
// suffix must match COLOR_KEYS in src/server/theme.ts.
const color = (suffix, light, dark) =>
  `  --bd-color-${suffix}: light-dark(\n    var(--bd-theme-light-${suffix}, ${light}),\n    var(--bd-theme-dark-${suffix}, ${dark})\n  );`

// Scaled size token: rem value multiplied by a theme-controlled scale factor
const scaled = (name, rem, scaleVar) =>
  `  ${name}: calc(${rem}rem * var(${scaleVar}));`

const css = `/* =================================================================
   bd-hub Design Tokens
   Generated from @catppuccin/palette — do not edit by hand.
   Run: pnpm generate-tokens
   Dark  → Catppuccin Mocha
   Light → Catppuccin Latte
   Uses CSS light-dark() with color-scheme: light dark
   Themeable via bd-hub.config.json → served as /theme.css, which sets the
   --bd-theme-* / --bd-color-scheme override vars referenced below.
   ================================================================= */

:root {
  color-scheme: var(--bd-color-scheme, light dark);

  /* ── Typography: families ───────────────────────────────────── */
  --bd-font-family: var(
    --bd-theme-font-family,
    system-ui,
    -apple-system,
    sans-serif
  );
  --bd-font-family-mono: var(
    --bd-theme-font-family-mono,
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace
  );

  /* ── Theme scale factors ────────────────────────────────────── */
  --bd-font-scale: var(--bd-theme-font-scale, 1);
  /** dense → 0.75, normal → 1, spacious → 1.25 */
  --bd-space-scale: var(--bd-theme-space-scale, 1);

  /* ── Backgrounds ────────────────────────────────────────────── */
${color('bg-base', l.mantle.hex, m.base.hex)}
${color('bg-mantle', l.crust.hex, m.mantle.hex)}
${color('bg-surface', l.base.hex, m.surface0.hex)}

  /* ── Borders ────────────────────────────────────────────────── */
${color('border', l.surface0.hex, m.surface0.hex)}
${color('border-muted', l.surface1.hex, m.surface1.hex)}

  /* ── Text ───────────────────────────────────────────────────── */
${color('text-primary', l.text.hex, m.text.hex)}
${color('text-muted', l.subtext0.hex, m.subtext0.hex)}
${color('text-on-accent', l.base.hex, m.base.hex)}

  /* ── Accents ────────────────────────────────────────────────── */
${color('accent-in-progress', l.blue.hex, m.blue.hex)}
${color('accent-done', l.green.hex, m.green.hex)}

  /* ── Priority chips ─────────────────────────────────────────── */
${color('priority-p0', l.red.hex, m.red.hex)}
${color('priority-p1', l.peach.hex, m.peach.hex)}
${color('priority-p2', l.yellow.hex, m.yellow.hex)}
${color('priority-p3', l.green.hex, m.green.hex)}

  /* ── Shadows ────────────────────────────────────────────────── */
  --bd-shadow-card: light-dark(
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.4)
  );

  /* ── Typography: font sizes ─────────────────────────────────── */
  /** Tiny chips, badges, and labels */
${scaled('--bd-font-size-2xs', 0.625, '--bd-font-scale')}
  /** Captions, tallies, secondary metadata */
${scaled('--bd-font-size-xs', 0.7, '--bd-font-scale')}
  /** Secondary body text, action links */
${scaled('--bd-font-size-sm', 0.8, '--bd-font-scale')}
  /** Primary body text, component titles */
${scaled('--bd-font-size-base', 0.875, '--bd-font-scale')}
  /** Sub-headings, dialog section titles */
${scaled('--bd-font-size-md', 0.95, '--bd-font-scale')}
  /** Top-level headings */
${scaled('--bd-font-size-lg', 1.05, '--bd-font-scale')}

  /* ── Typography: font weights ───────────────────────────────── */
  --bd-font-weight-normal: 400;
  --bd-font-weight-semibold: 600;
  --bd-font-weight-bold: 700;

  /* ── Typography: line heights ───────────────────────────────── */
  /** Compact headings and titles */
  --bd-line-height-tight: 1.35;
  /** Comfortable body/prose reading */
  --bd-line-height-body: 1.6;

  /* ── Typography: letter spacing ─────────────────────────────── */
  /** Standard label tracking (chips, project name) */
  --bd-tracking-label: 0.04em;
  /** Tighter section-title tracking */
  --bd-tracking-sm: 0.06em;
  /** Strong heading tracking (column headers) */
  --bd-tracking-lg: 0.08em;

  /* ── Spacing ────────────────────────────────────────────────── */
  /** 2 px — hairline gaps, chip padding */
${scaled('--bd-space-0-5', 0.125, '--bd-space-scale')}
  /** 4 px — button padding, micro gaps */
${scaled('--bd-space-1', 0.25, '--bd-space-scale')}
  /** 6 px — small item gaps, badge padding */
${scaled('--bd-space-1-5', 0.375, '--bd-space-scale')}
  /** 8 px — item gaps, inline padding */
${scaled('--bd-space-2', 0.5, '--bd-space-scale')}
  /** 12 px — header/card padding, larger gaps */
${scaled('--bd-space-3', 0.75, '--bd-space-scale')}
  /** 16 px — section padding */
${scaled('--bd-space-4', 1, '--bd-space-scale')}
  /** 20 px — wide content padding */
${scaled('--bd-space-5', 1.25, '--bd-space-scale')}

  /* ── Border radii ───────────────────────────────────────────── */
  /** 3 px — chips, inline code */
  --bd-radius-sm: 3px;
  /** 6 px — cards, code blocks */
  --bd-radius-md: 6px;
  /** 8 px — dialogs, modals */
  --bd-radius-lg: 8px;
  /** Full pill shape — badges, tags */
  --bd-radius-full: 9999px;
}
`

writeFileSync(outFile, css, 'utf8')
console.log(`✓ tokens.css generated from @catppuccin/palette (mocha + latte)`)
console.log(`  → ${outFile}`)
