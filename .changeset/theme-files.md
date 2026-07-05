---
'bd-hub': minor
---

Built-in themes now live as standalone JSON files in the `themes/` directory, indexed by file name, so new themes can be contributed without touching code. Only the active theme is read at runtime, and the default Catppuccin palette is a theme file like any other — used whenever the config has no `theme` option. `pnpm generate-schema` keeps the config JSON schema's theme-name enum in sync with the directory.
