import { css } from 'lit'

/**
 * Shared button reset for bd-hub Lit components.
 *
 * Removes all UA browser styles from button elements and adds a consistent
 * :focus-visible ring using design tokens. Apply by including this CSSResult
 * as the first item in a component's `static override styles` array:
 *
 *   static override styles = [buttonBase, css`...`]
 *
 * Component-specific class rules (e.g. `.my-btn`) can then add colour, size,
 * and layout without repeating the reset.
 */
export const buttonBase = css`
  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
    appearance: none;
  }
  button:focus-visible {
    outline: 2px solid var(--bd-color-accent-in-progress);
    outline-offset: 2px;
    border-radius: var(--bd-radius-sm);
  }
`
