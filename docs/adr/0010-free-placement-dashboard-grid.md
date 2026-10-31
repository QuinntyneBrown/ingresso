# 0010 Free-placement dashboard grid ported from qbc-grid

- Status: accepted

## Context

The first requirements described the dashboard as an ordered list of large and small tiles, reordered by drag. The
owner wants the dashboard to behave like an operator dashboard: tiles placed where the owner puts them, moved and
resized on a grid. qbc-grid (`github.com/QuinntyneBrown/qbc-grid`, MIT, same owner) already implements that model
for Angular with signals, keyboard operation, live-region announcements and deterministic layout repair. It has no
runtime dependencies, but it is desktop only: no breakpoints, no touch, and no column collapse.

## Decision

- Port qbc-grid's `grid/` source into the component library as `ig-tile-grid` (`TileGrid`) with the
  `igTileGridTile` template directive. Keep its file-per-helper layout and its behaviour: occupied destinations
  are refused, and no tile moves unless the user moves it.
- Map its `--qbc-*` tokens to Fluent UI v9 token roles. Component-scoped knobs use `--ig-tile-grid-*`.
- Store each tile's `X`, `Y`, `Cols` and `Rows` on the server. The client saves the whole layout in one request
  (`PUT /api/tiles/layout`).
- Add responsive collapse, which qbc-grid lacks. From 1024px the saved 12-column layout is shown. Below 1024px the
  grid renders a flow list in reading order: two columns from 768px, one column below. Edit mode is offered only
  from 1024px. A width change never emits or saves a layout.
- Keep the qbc-grid MIT notice in each ported file and in `frontend/projects/components/README.md`.

## Consequences

- `L2-009`, `L2-016`, `L2-017`, `L2-019` and `L2-042` describe the free-placement model, and `L2-051` to `L2-054`
  add size limits, layout saving, repair and the edit-width rule. `L2-018` (order validation) is replaced by
  `L2-052`.
- Touch editing is not supported. Phones and tablets get a read-only flow list.
- The CDK drop list on the dashboard is removed.
