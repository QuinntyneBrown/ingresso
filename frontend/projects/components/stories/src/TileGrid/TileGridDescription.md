A tile grid places each tile on a 12-column grid at the column, row and span the person chose. In edit mode the person drags a tile to free cells, drags its corner to resize it, or uses the arrow keys (Shift with an arrow resizes). A destination that overlaps another tile is refused; no other tile ever moves. The grid emits the whole layout through `layoutChange` after each committed change, and the host saves it.

Below 1024px the grid collapses to a flow list in reading order and edit mode is unavailable. The saved layout is never changed by a width change.

Ported from [qbc-grid](https://github.com/QuinntyneBrown/qbc-grid) (MIT).
