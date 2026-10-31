# Quick jump

## Overview

Owners with many tiles reach an app faster by typing than by scanning. Quick jump is a search field in the header that opens from any screen with the `/` key.

**quick jump** — header search that filters tiles as the owner types and opens the highlighted match with Enter

The search runs entirely in the browser over the tiles the store already holds. No request leaves the browser until the owner opens a match, which then follows the `open-app` path.

## Description

The slice runs from the ingresso web app to the ingresso database.

- **`AppShell`** — places `ig-search` in the header's `search` slot, binds it to `TilesStore.search`, and calls `jump()` on `searched`.
- **`ig-search`** — library search field. `<TO SUPPLY>`: the global `/` shortcut, its guard against text inputs, and Escape focus return.
- **`TilesStore`** — computes the filtered list from `search`, matching name, address, category and description case-insensitively.
- **`AppShell.jump()`** — opens the first match in a new tab and calls `TilesStore.markOpened`.
- **`DashboardPage`** — renders the filtered tiles, or `ig-empty-state` with Clear the search when nothing matches.

The current source differs from the requirements in these points. Each is open work for the slice.

- `L2-023` requires Up and Down to move a highlight that wraps at the ends. `AppShell.jump()` always opens the first match, and no highlight exists.
- `L2-022` requires a polite announcement of the result count. `<TO SUPPLY>`: the live region that carries the count.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-021` | `L1-005` | Pressing `/` outside a text field shall open the search from any screen. |
| `L2-022` | `L1-005` | Search shall filter tiles by name, address, category and description, case-insensitively. |
| `L2-023` | `L1-005` | Enter shall open the highlighted match. |

## Diagrams

### System context

The owner searches their tiles in ingresso and opens the match in a new tab.

![C4 system context for quick jump](diagrams/c4-context.png)

### Containers

Filtering runs in the web app. Only opening a match calls `Ingresso.Api`, through `open-app`.

![C4 container view for quick jump](diagrams/c4-container.png)

### Components

`AppShell` and `ig-search` own the input. `TilesStore` owns the filter, and `DashboardPage` renders the result.

![C4 component view for quick jump](diagrams/c4-component.png)

### Class structure

`AppShell` writes `TilesStore.search`. The store derives `filtered` from `tiles` and `search`.

![Class diagram for quick jump](diagrams/class-structure.png)

### Behaviour — jump to an app

The `/` key opens the field only when focus is outside a text input. Typing filters in place, and Enter opens the highlighted match.

![Sequence diagram: jump to an app](diagrams/sequence-jump.png)
