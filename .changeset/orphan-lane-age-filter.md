---
'bd-hub': patch
---

Fix duration selector not filtering tasks in the "Everything else" swim lane. Orphan tasks (those with no parent epic) are now filtered by their own creation date when a non-"All time" duration is selected.
