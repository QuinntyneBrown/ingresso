import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

export type ListVariant = 'simple' | 'catalog';

/**
 * A vertical list of items with a title and a meta line, on a native list: `<ul ig-list>` holding
 * `<li ig-list-item>` rows. `simple` rows are divided lines (`surface` puts them on a flush card);
 * `catalog` rows are separate bordered rows with an icon (`[slot=media]`) and an action (`[slot=action]`),
 * as in the directory of apps to add. Row actions carry the object name ("Add Asana") for screen readers.
 */
@Component({
  selector: 'ul[ig-list], ol[ig-list]',
  template: '<ng-content />',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class List {
  readonly variant = input<ListVariant>('simple');
  /** Simple lists only: puts the rows on a bordered surface (`card card--flush`). */
  readonly surface = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    this.variant() === 'catalog' ? 'catalog' : this.surface() ? 'list card card--flush' : 'list',
  );
}

/**
 * One row of an `ig-list`: `title`, an optional `meta` line and a second `detail` line, `[slot=media]` before and
 * `[slot=action]` after.
 */
@Component({
  selector: 'li[ig-list-item]',
  template: `
    <ng-content select="[slot=media]" />
    @if (catalog()) {
      <span class="catalog__text">
        <span class="catalog__name">{{ title() }}</span>
        @if (meta()) {
          <span class="catalog__description">{{ meta() }}</span>
        }
      </span>
    } @else {
      <div class="list__body">
        <div class="list__title">{{ title() }}</div>
        @if (meta()) {
          <div class="list__meta">{{ meta() }}</div>
        }
        @if (detail()) {
          <div class="list__meta">{{ detail() }}</div>
        }
      </div>
    }
    <ng-content select="[slot=action]" />
  `,
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class ListItem {
  private readonly list = inject(List, { optional: true });

  readonly title = input.required<string>();
  readonly meta = input<string>();
  /** A second meta line, such as dates under a description. */
  readonly detail = input<string>();
  /** Lets the meta lines wrap instead of ending in an ellipsis; use when they must be read in full. */
  readonly wrap = input(false, { transform: booleanAttribute });
  /** Highlights the row on hover; use when the row holds the one link or button it acts on. */
  readonly interactive = input(false, { transform: booleanAttribute });

  protected readonly catalog = computed(() => this.list?.variant() === 'catalog');
  protected readonly classes = computed(() => {
    if (this.catalog()) return 'catalog__item';
    const classes = ['list__item'];
    if (this.interactive()) classes.push('list__item--interactive');
    if (this.wrap()) classes.push('list__item--wrap');
    return classes.join(' ');
  });
}
