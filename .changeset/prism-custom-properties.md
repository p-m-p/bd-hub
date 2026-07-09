---
'bd-hub': minor
---

Syntax highlighting is now themed through CSS custom properties: themes declare a `prism` color block (per token class, single or per-scheme) emitted as `--bd-theme-prism-*` vars, and the client ships one shared Prism token stylesheet with Catppuccin `light-dark()` fallbacks. Built-in themes no longer ship Prism CSS files, code blocks react to scheme changes natively, and the `prismTheme` CSS file option remains the full-control escape hatch.
