# bd-hub

Real-time kanban dashboard for [bd (beads)](https://github.com/gastownhall/beads) issue tracking. Run it from any project that uses beads.

## Prerequisites

- **bd** installed and available in `PATH`
- A project with `.beads/` initialised (`bd init` run at least once)

## Usage

```sh
npx bd-hub
```

Opens the dashboard at `http://localhost:3003`. The board shows your beads tasks grouped by epic, with columns for open (blocked), ready, in-progress, and done. Updates in real time as you run `bd` commands.

### Options

```
--port <n>   Port to listen on (default: 3003)
--open       Open in your default browser on startup
--help, -h   Show help
```

### Examples

```sh
npx bd-hub --open          # start and open browser
npx bd-hub --port 4000     # use a different port
```

## Theming

The dashboard ships with the Catppuccin theme (Latte in light mode, Mocha in dark mode, following your OS preference). To customise it, create an optional `bd-hub.config.json` in the directory you start `bd-hub` from. The `theme` option accepts either the name of a built-in theme or a theme object.

### Built-in themes

```json
{
  "$schema": "https://raw.githubusercontent.com/p-m-p/bd-hub/main/schema/config.schema.json",
  "theme": "dracula"
}
```

| Name | Description |
| --- | --- |
| `catppuccin` | The default — Latte in light mode, Mocha in dark mode |
| `dracula` | [Dracula](https://draculatheme.com), dark mode only |
| `monokai` | Classic [Monokai](https://monokai.pro), dark mode only |
| `solarized` | [Solarized](https://ethanschoonover.com/solarized) — Light in light mode, Dark in dark mode |

Built-in themes include matching syntax highlighting for code blocks.

#### Contributing a theme

Built-in themes are plain JSON files in the [`themes/`](themes/) directory — the file name is the theme name, and only the active theme is loaded at runtime. To add one:

1. Create `themes/<name>.json` with the same shape as a custom theme object (see below). Fixed-scheme palettes set `"mode"` and `"colors"` (like `dracula.json`); light/dark pairs use `"light"` and `"dark"` blocks (like `solarized.json`).
2. Optionally add a `"prism"` block for syntax-highlighting colors — `"colors"` for both schemes and/or `"light"`/`"dark"` per scheme, one key per Prism token (see the schema or `dracula.json`). Set all of them for a dark palette; anything left out keeps its Catppuccin color.
3. Run `pnpm generate-schema` to add the name to the config JSON schema — a unit test fails if you forget.

### Custom themes

```json
{
  "$schema": "https://raw.githubusercontent.com/p-m-p/bd-hub/main/schema/config.schema.json",
  "theme": {
    "font": {
      "family": "Inter, sans-serif",
      "monoFamily": "JetBrains Mono, monospace",
      "scale": 1.1
    },
    "spacing": "dense",
    "mode": "auto",
    "light": { "bgBase": "#fafafa" },
    "dark": { "bgBase": "#11111b", "accentDone": "#94e2d5" }
  }
}
```

Everything is optional — anything you leave out keeps its Catppuccin default. Config edits apply on browser refresh; no server restart needed. Adding the `$schema` reference gives you validation and autocompletion in editors that support JSON Schema.

- **`font.family`** / **`font.monoFamily`** — any CSS font stack
- **`font.scale`** — multiplies all font sizes (e.g. `1.1` for 10% larger text)
- **`spacing`** — `"dense"`, `"normal"`, or `"spacious"`
- **`mode`** — `"auto"` (follow OS light/dark, default), `"light"`, or `"dark"` (fixed)
- **`light`** / **`dark`** — color overrides per scheme
- **`colors`** — a single set of color overrides applied in both schemes, for a custom theme that doesn't react to light/dark; combine with `mode` to fix the scheme used for native UI like scrollbars and form controls
- **`prism`** — syntax-highlighting colors for code blocks, with the same `colors`/`light`/`dark` structure; one key per Prism token class (`keyword`, `string`, `comment`, …) plus `text` and `background` — see the JSON schema for the full list
- **`prismTheme`** — path(s) to your own Prism CSS file(s) for full control over code-block styling; overrides `prism` colors entirely

Color keys (any CSS color value works — hex, `rgb()`, `oklch()`, named):

| Key | Used for |
| --- | --- |
| `bgBase` | page background |
| `bgMantle` | recessed surfaces (chips, code) |
| `bgSurface` | cards and dialogs |
| `border` / `borderMuted` | separators and outlines |
| `textPrimary` / `textMuted` | body and secondary text |
| `textOnAccent` | text on filled chips |
| `accentInProgress` / `accentDone` | column/status accents |
| `priorityP0`–`priorityP3` | priority chips |

## Install beads

```sh
brew install gastownhall/tap/bd
```

See the [beads repository](https://github.com/gastownhall/beads) for full installation instructions.
