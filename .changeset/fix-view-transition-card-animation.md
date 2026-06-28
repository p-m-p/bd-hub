---
'bd-hub': minor
---

Replace full-page view transition fade with per-card FLIP animation. The previous implementation caused the entire board to cross-fade on every update and would flash when multiple SSE events fired in rapid succession. Cards now animate individually between columns using the Web Animations API — sliding from their previous position to the new one with a subtle counter-tilt that unwinds on arrival (clockwise for right-to-left travel, counter-clockwise for left-to-right). Overlapping transitions are skipped to eliminate flashing.
