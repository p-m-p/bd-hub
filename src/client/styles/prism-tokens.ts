import { css } from 'lit'

/**
 * Shared Prism token stylesheet. Every color reads a --bd-theme-prism-*
 * override var (set on :root by /theme.css from the active theme's
 * `prism` block — custom properties inherit through the shadow DOM)
 * with the bundled Catppuccin palette as the light-dark() fallback.
 * Fallback values come from catppuccin-prismjs (latte / mocha).
 * The var suffixes are defined by PRISM_COLOR_KEYS in src/server/theme.ts.
 */
export const prismTokens = css`
  code[class*='language-'],
  pre[class*='language-'] {
    color: light-dark(
      var(--bd-theme-prism-light-text, #4c4f69),
      var(--bd-theme-prism-dark-text, #cdd6f4)
    );
  }

  :not(pre) > code[class*='language-'],
  pre[class*='language-'] {
    background: light-dark(
      var(--bd-theme-prism-light-background, #e6e9ef),
      var(--bd-theme-prism-dark-background, #181825)
    );
  }

  .token.comment {
    color: light-dark(
      var(--bd-theme-prism-light-comment, #7c7f93),
      var(--bd-theme-prism-dark-comment, #9399b2)
    );
  }

  .token.prolog {
    color: light-dark(
      var(--bd-theme-prism-light-prolog, #8839ef),
      var(--bd-theme-prism-dark-prolog, #cba6f7)
    );
  }

  .token.doctype {
    color: light-dark(
      var(--bd-theme-prism-light-doctype, #8839ef),
      var(--bd-theme-prism-dark-doctype, #cba6f7)
    );
  }

  .token.cdata {
    color: light-dark(
      var(--bd-theme-prism-light-cdata, #179299),
      var(--bd-theme-prism-dark-cdata, #94e2d5)
    );
  }

  .token.punctuation {
    color: light-dark(
      var(--bd-theme-prism-light-punctuation, #7c7f93),
      var(--bd-theme-prism-dark-punctuation, #9399b2)
    );
  }

  .token.namespace {
    color: light-dark(
      var(--bd-theme-prism-light-namespace, #df8e1d),
      var(--bd-theme-prism-dark-namespace, #f9e2af)
    );
  }

  .token.property {
    color: light-dark(
      var(--bd-theme-prism-light-property, #1e66f5),
      var(--bd-theme-prism-dark-property, #89b4fa)
    );
  }

  .token.tag {
    color: light-dark(
      var(--bd-theme-prism-light-tag, #1e66f5),
      var(--bd-theme-prism-dark-tag, #89b4fa)
    );
  }

  .token.boolean {
    color: light-dark(
      var(--bd-theme-prism-light-boolean, #fe640b),
      var(--bd-theme-prism-dark-boolean, #fab387)
    );
  }

  .token.number {
    color: light-dark(
      var(--bd-theme-prism-light-number, #fe640b),
      var(--bd-theme-prism-dark-number, #fab387)
    );
  }

  .token.constant {
    color: light-dark(
      var(--bd-theme-prism-light-constant, #fe640b),
      var(--bd-theme-prism-dark-constant, #fab387)
    );
  }

  .token.symbol {
    color: light-dark(
      var(--bd-theme-prism-light-symbol, #df8e1d),
      var(--bd-theme-prism-dark-symbol, #f9e2af)
    );
  }

  .token.deleted {
    color: light-dark(
      var(--bd-theme-prism-light-deleted, #d20f39),
      var(--bd-theme-prism-dark-deleted, #f38ba8)
    );
  }

  .token.selector {
    color: light-dark(
      var(--bd-theme-prism-light-selector, #1e66f5),
      var(--bd-theme-prism-dark-selector, #89b4fa)
    );
  }

  .token.attr-name {
    color: light-dark(
      var(--bd-theme-prism-light-attr-name, #df8e1d),
      var(--bd-theme-prism-dark-attr-name, #f9e2af)
    );
  }

  .token.string {
    color: light-dark(
      var(--bd-theme-prism-light-string, #40a02b),
      var(--bd-theme-prism-dark-string, #a6e3a1)
    );
  }

  .token.char {
    color: light-dark(
      var(--bd-theme-prism-light-char, #40a02b),
      var(--bd-theme-prism-dark-char, #a6e3a1)
    );
  }

  .token.builtin {
    color: light-dark(
      var(--bd-theme-prism-light-builtin, #d20f39),
      var(--bd-theme-prism-dark-builtin, #f38ba8)
    );
  }

  .token.inserted {
    color: light-dark(
      var(--bd-theme-prism-light-inserted, #40a02b),
      var(--bd-theme-prism-dark-inserted, #a6e3a1)
    );
  }

  .token.operator {
    color: light-dark(
      var(--bd-theme-prism-light-operator, #04a5e5),
      var(--bd-theme-prism-dark-operator, #89dceb)
    );
  }

  .token.entity {
    color: light-dark(
      var(--bd-theme-prism-light-entity, #d20f39),
      var(--bd-theme-prism-dark-entity, #f38ba8)
    );
  }

  .token.url {
    color: light-dark(
      var(--bd-theme-prism-light-url, #40a02b),
      var(--bd-theme-prism-dark-url, #a6e3a1)
    );
  }

  .token.atrule {
    color: light-dark(
      var(--bd-theme-prism-light-atrule, #8839ef),
      var(--bd-theme-prism-dark-atrule, #cba6f7)
    );
  }

  .token.attr-value {
    color: light-dark(
      var(--bd-theme-prism-light-attr-value, #40a02b),
      var(--bd-theme-prism-dark-attr-value, #a6e3a1)
    );
  }

  .token.keyword {
    color: light-dark(
      var(--bd-theme-prism-light-keyword, #8839ef),
      var(--bd-theme-prism-dark-keyword, #cba6f7)
    );
  }

  .token.function {
    color: light-dark(
      var(--bd-theme-prism-light-function, #1e66f5),
      var(--bd-theme-prism-dark-function, #89b4fa)
    );
  }

  .token.class-name {
    color: light-dark(
      var(--bd-theme-prism-light-class-name, #df8e1d),
      var(--bd-theme-prism-dark-class-name, #f9e2af)
    );
  }

  .token.regex {
    color: light-dark(
      var(--bd-theme-prism-light-regex, #ea76cb),
      var(--bd-theme-prism-dark-regex, #f5c2e7)
    );
  }

  .token.important {
    color: light-dark(
      var(--bd-theme-prism-light-important, #8839ef),
      var(--bd-theme-prism-dark-important, #cba6f7)
    );
  }

  .token.variable {
    color: light-dark(
      var(--bd-theme-prism-light-variable, #4c4f69),
      var(--bd-theme-prism-dark-variable, #cdd6f4)
    );
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.italic {
    font-style: italic;
  }
`
