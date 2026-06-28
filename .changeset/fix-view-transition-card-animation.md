---
'bd-hub': minor
---

Replace full-page view transition fade with per-card slide animation. The previous implementation caused the entire board to cross-fade on every update and would flash when multiple SSE events fired in rapid succession. Cards now animate individually between columns using `view-transition-class: bd-task-card` with the root transition suppressed, and overlapping transitions are skipped to eliminate flashing.
