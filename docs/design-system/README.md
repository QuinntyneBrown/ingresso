# ingresso design system

Extracted from [docs/mocks](../mocks/README.md) on 2026-10-31. Open [index.html](index.html) locally. Design rules and logo come from the Magic Patterns brand reference: vermilion `#CF3B20`, ink `#17181C`, warm canvas `#F5F4F0`, Geist.

## Foundations
| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ramps, roles, both themes, contrast pairs |
| [Typography](foundations/typography.html) | Families, role specimens, measure |
| [Spacing](foundations/spacing.html) | 4px scale, inside and between |
| [Layout](foundations/layout.html) | Breakpoints, live grid, templates |
| [Elevation](foundations/elevation.html) | Shadows, surfaces, z-order |
| [Shape](foundations/shape.html) | Radii and borders |
| [Motion](foundations/motion.html) | Durations and easings, reduced motion |
| [Iconography](foundations/iconography.html) | Icon sheet, sizes, logo |
| [Theming](foundations/theming.html) | Tiers, dark, tokens.json |
| [Responsive](foundations/responsive.html) | Behaviour by component, testing matrix |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA commitments |
| [Content](foundations/content.html) | Voice, formulas, microcopy |

## Components
| Component | Group | First variant | States | Source mocks |
|---|---|---|---|---|
| [Button](components/button.html) | Actions | Primary, secondary, ghost, link, danger | matrix | `pages/dashboard/default`, `dialogs/add-app/busy` |
| [Button group](components/button-group.html) | Actions | Segmented | matrix | `pages/settings/default` |
| [Link](components/link.html) | Actions | Inline | matrix | `pages/directory/default`, `pages/sign-in/default` |
| [Menu](components/menu.html) | Actions | Account menu | matrix | `pages/dashboard/default` |
| [Text field](components/text-field.html) | Inputs | Text and URL | matrix | `dialogs/add-app/default`, `dialogs/add-app/invalid` |
| [Textarea](components/textarea.html) | Inputs | Default | matrix | `dialogs/add-app/default` |
| [Select](components/select.html) | Inputs | Default | matrix | `pages/settings/default` |
| [Checkbox](components/checkbox.html) | Inputs | Single | matrix | `pages/settings/default` |
| [Radio group](components/radio-group.html) | Inputs | Appearance | matrix | `pages/settings/default`, `pages/settings/success` |
| [Switch](components/switch.html) | Inputs | On and off | matrix | `pages/settings/default` |
| [Form field](components/form-field.html) | Inputs | With help | matrix | `dialogs/add-app/invalid`, `pages/sign-in/invalid` |
| [Form layout](components/form-layout.html) | Inputs | Invalid | matrix | `dialogs/add-app/invalid`, `dialogs/add-app/busy` |
| [App header](components/app-header.html) | Navigation | Signed in | n/a | `pages/dashboard/default`, `pages/dashboard/editing` |
| [Tabs](components/tabs.html) | Navigation | Underline | matrix | `pages/settings/default` |
| [Breadcrumb](components/breadcrumb.html) | Navigation | Full | n/a | `pages/dashboard/default` |
| [Pagination](components/pagination.html) | Navigation | Numbered | matrix | `pages/dashboard/default` |
| [Skip link](components/skip-link.html) | Navigation | Focused | matrix | `pages/dashboard/default` |
| [Card](components/card.html) | Containers | Default | matrix | `pages/settings/default`, `pages/sign-in/default` |
| [Dialog](components/dialog.html) | Containers | Destructive | matrix | `dialogs/add-app/default`, `dialogs/edit-app/default` |
| [Tooltip](components/tooltip.html) | Containers | Text | matrix | `pages/dashboard/editing` |
| [Divider](components/divider.html) | Containers | Horizontal | n/a | `pages/sign-in/default` |
| [Layout primitives](components/layout-primitives.html) | Containers | Stack | n/a | `pages/dashboard/default` |
| [Table](components/table.html) | Data display | Sortable | matrix | `pages/dashboard/default` |
| [List](components/list.html) | Data display | Catalog | matrix | `pages/directory/default` |
| [Description list](components/description-list.html) | Data display | Horizontal | n/a | `pages/dashboard/default` |
| [Avatar](components/avatar.html) | Data display | Tinted | matrix | `pages/dashboard/default` |
| [Badge](components/badge.html) | Data display | Status | n/a | `pages/dashboard/offline` |
| [Chip](components/chip.html) | Data display | Filter | matrix | `pages/dashboard/default` |
| [Toast](components/toast.html) | Feedback | Success | matrix | `notifications/app-toast/success`, `notifications/app-toast/with-action` |
| [Alert](components/alert.html) | Feedback | Danger | n/a | `pages/dashboard/error`, `pages/dashboard/offline` |
| [Inline message](components/inline-message.html) | Feedback | Help | n/a | `dialogs/add-app/invalid` |
| [Progress bar](components/progress-bar.html) | Feedback | Determinate | n/a | `pages/dashboard/loading` |
| [Spinner](components/spinner.html) | Feedback | Standalone | n/a | `dialogs/add-app/busy` |
| [Skeleton](components/skeleton.html) | Feedback | Tile | n/a | `pages/dashboard/loading`, `pages/directory/loading` |
| [Empty state](components/empty-state.html) | Feedback | First run | n/a | `pages/dashboard/empty`, `pages/dashboard/no-results` |
| [Error page](components/error-page.html) | Feedback | 403 | n/a | `pages/not-found/default`, `pages/forbidden/default` |
| [App tile](components/app-tile.html) | ingresso | Large | matrix | `pages/dashboard/default`, `pages/dashboard/editing` |
| [App icon](components/app-icon.html) | ingresso | Palette | n/a | `pages/dashboard/default`, `pages/directory/default` |
| [Tile grid](components/tile-grid.html) | ingresso | Loading | n/a | `pages/dashboard/default`, `pages/dashboard/loading` |
| [Layout bar](components/layout-bar.html) | ingresso | Default | n/a | `pages/dashboard/editing` |

## Patterns
| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | Layout, validation timing, summary and submit states for every form. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Which feedback for which action, and how to show waiting. |
| [Empty and error states](patterns/empty-and-error-states.html) | Copy formulas and when to use which. |
| [Navigation and page structure](patterns/navigation-and-page-structure.html) | The shell, page header and how people move around. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | When to use a dialog, drawer, popover or a page. |
| [Data tables and lists](patterns/data-tables-and-lists.html) | Density, sorting and responsive strategy for collections. |
| [Notifications](patterns/notifications.html) | Toast, banner and notification-centre rules. |
| [Content and tone](patterns/content-and-tone.html) | Voice, sentence case, verbs and the microcopy library. |

## Tokens
- `tokens/tokens.css`: source of truth (primitives, semantic tokens, light and dark themes, reduced motion).
- `tokens/tokens.json`: DTCG export generated by `tokens_to_json.py`; never edit by hand.
- `tokens/contrast-pairs.json`: every foreground/background pairing the components rely on.
- `tokens/fonts/`: self-hosted variable Geist and Geist Mono (ADR 0005).

## Drift found in the mocks
| Mock | Issue | Resolution |
|---|---|---|
| `assets/ui.css` (app icon, swatch) | Literal `#fff` for initials and swatch glyphs | Replaced with `--palette-white` |
| `assets/ui.css` (spinner, skeleton, indeterminate progress, pulse) | Raw 0.8s / 1.4s / 1.6s animation durations | New tokens `--duration-spin`, `--duration-shimmer`, `--duration-pulse` (zeroed under reduced motion) |
| `pages/dashboard/*` | Inline `list-style` resets and `style` attributes on the tile list | Documented as `.grid-tiles` usage; swatch colours moved to `--app-color-*` tokens |
| `assets/ui.css` (search icon, tile icons) | Magic-number nudges (0.1rem, 0.35em) | Snapped to the 4px scale or centred by transform |
| `pages/dashboard/editing` | Edit-layout bar used accent-subtle with accent text, which read as an error in dark | Raised surface with an accent border (`.layout-bar`) |
| `pages/dashboard/*` | Account menu trigger shown but the open menu is not mocked | Documented on the Menu page; add the open state to the dashboard mocks |
| Mocks (`tabs`, `table`, `chip`, `pagination` …) | Core components not exercised by ingresso mocks | Documented as the core set |

## Verification
Run from the repository root; the skill folder is `.claude/skills/extracting-design-systems`.

```sh
python .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css --pairs docs/design-system/tokens/contrast-pairs.json
python .claude/skills/extracting-design-systems/scripts/tokens_to_json.py docs/design-system/tokens/tokens.css
python .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
```

See the results recorded below after each extraction.

**Record (2026-10-31)**

| Check | Result |
|---|---|
| `check_contrast.py` (light and dark, 138 pairs) | 138 passed, 0 failed |
| `tokens_to_json.py` | 263 tokens written to `tokens/tokens.json` |
| `check_design_system.py` | 61 pages (40 components, 8 patterns, 12 foundations), 0 errors, 0 warnings |
| `check_mocks.py` after relinking the mocks to `../design-system/` | 16 screens, 54 mocks, 0 errors, 0 warnings |
| Screenshots (`screenshot_mocks.py`) | Colour, App tile, Button, Dialog pages at 360, 768 and 1280, light and dark, reviewed |
