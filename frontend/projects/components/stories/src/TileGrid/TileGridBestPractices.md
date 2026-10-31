### Best practices

#### Do

- Give every tile a `label`, so moves and resizes are announced by name.
- Save the layout from `layoutChange` and pass the saved layout back in; the grid holds no store.
- Set `minCols`, `maxCols`, `minRows` and `maxRows` on tiles to enforce product size limits.
- Label the grid (`aria-label="Your apps"`).

#### Don't

- Don't push, swap or compact other tiles to make room; refuse the destination instead.
- Don't offer edit mode below 1024px or on touch; the grid turns it off there.
- Don't place interactive controls where a press should start a drag; presses on buttons, links and fields belong to them.
