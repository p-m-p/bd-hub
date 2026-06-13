---
'bd-hub': minor
---

Fix Prism syntax theme not following forced color mode. Code blocks now correctly switch between dark and light Prism themes based on the resolved `--bd-color-scheme` (set by `mode` in `bd-hub.config.json`) rather than the OS `prefers-color-scheme` media query.

Also allows users to supply custom Prism theme CSS via `bd-hub.config.json`:

```json
{
  "theme": {
    "prismTheme": "./my-prism-theme.css"
  }
}
```

Or with separate dark/light themes:

```json
{
  "theme": {
    "prismTheme": {
      "dark": "./prism-dark.css",
      "light": "./prism-light.css"
    }
  }
}
```
