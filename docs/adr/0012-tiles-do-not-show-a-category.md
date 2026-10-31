# 0012 Tiles show name, host, description and colour; category stays out of the tile

- Status: accepted (journey 03, advance confirmation from `docs/prompts/03-view-the-dashboard.md`)

## Context

L2-008 said a dashboard tile shows name, address host, category and colour. The mocks, the design system and
`ig-app-tile` have never shown a category: a tile carries the icon, name, host and, on large tiles, the
description. A category is entered in the Add and Edit app dialogs and is kept with the tile.

## Decision

The tile does not display its category. L2-008 now lists what the tile shows: name, address host, description
(large tiles) and colour. Adding a category line would change every dashboard mock and the tile component for
no journey that needs it. If category grouping or filtering is wanted later, it gets its own requirement,
mock and design.

## Consequences

- L2-008 and the show-dashboard design name what a tile shows; the mocks and component are unchanged.
- Category is stored and editable only.
