---
'bd-hub': patch
---

Fix double border between swimlane headers and the column header row. The epic lane header had a redundant `border-top` that stacked with the column header's `border-bottom`, producing a thickened double line. Most visible when lanes are collapsed.
