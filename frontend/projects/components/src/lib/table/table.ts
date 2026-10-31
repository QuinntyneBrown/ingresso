import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export type SortDirection = 'ascending' | 'descending' | 'none';

/**
 * The scrolling frame around an `ig-table` (`.table-wrap`), so a wide table scrolls inside it on phones rather than
 * forcing the page to scroll. Pass `label` to make it a named, keyboard-scrollable region.
 */
@Component({
  selector: 'ig-table-wrap',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      overflow-x: auto;
      border: 1px solid var(--colorNeutralStroke2);
      border-radius: var(--borderRadius2XLarge);
      background: var(--colorNeutralBackground1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'table-wrap',
    '[attr.role]': 'label() ? "region" : null',
    '[attr.aria-label]': 'label()',
    '[attr.tabindex]': 'label() ? 0 : null',
  },
})
export class TableWrap {
  readonly label = input<string | null>(null);
}

/**
 * Styles a native table (`<table ig-table>`) with a `<caption>`, `th scope="col"` headers, hover and selected
 * (`tr[aria-selected="true"]`) rows. `td.num` right-aligns numbers with tabular figures, `td.mono` sets monospace,
 * and `.row-actions` shows on row hover or focus (always on touch screens).
 */
@Component({
  selector: 'table[ig-table]',
  template: '<ng-content />',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'table' },
})
export class Table {}

/**
 * A sortable column header (`<th ig-sort-header scope="col" [(sort)]="direction">App</th>`): wraps the label in a
 * button and sets `aria-sort`. Each press moves to ascending, then descending, then ascending again; `sort` is
 * two-way bindable so the page can reset other columns to `none`.
 */
@Component({
  selector: 'th[ig-sort-header]',
  template: `<button type="button" class="table__sort" (click)="toggle()"><ng-content /></button>`,
  styles: `
    .table__sort {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      gap: var(--spacingHorizontalXS);
      align-items: center;
      border-radius: var(--borderRadiusMedium);
    }
    .table__sort:focus-visible {
      outline: var(--ig-focus-ring-width) solid var(--colorStrokeFocus2);
      outline-offset: var(--ig-focus-ring-offset);
    }
    :host([aria-sort='ascending']) .table__sort::after {
      content: '↑';
    }
    :host([aria-sort='descending']) .table__sort::after {
      content: '↓';
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-sort]': 'sort()' },
})
export class SortHeader {
  readonly sort = model<SortDirection>('none');

  protected toggle(): void {
    this.sort.set(this.sort() === 'ascending' ? 'descending' : 'ascending');
  }
}
