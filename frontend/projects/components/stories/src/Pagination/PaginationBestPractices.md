### Best practices

#### Do

- Show a summary such as "Showing 1–20 of 38" beside it.
- Give each pagination a distinct `label` when a page has more than one.

#### Don't

- Don't paginate the dashboard; it shows every tile.
- Don't mark the current page by colour alone; `aria-current` carries it.
