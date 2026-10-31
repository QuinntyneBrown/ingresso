import { ChangeDetectionStrategy, Component, computed, input, numberAttribute, output } from '@angular/core';
import { Icon } from '../icon/icon';

type PageSlot = { kind: 'page'; page: number } | { kind: 'gap'; key: string };

/** Up to seven slots: every page when there are few, otherwise first, last and the pages around the current one. */
function pageSlots(page: number, count: number): PageSlot[] {
  const pages = (from: number, to: number): PageSlot[] =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ kind: 'page', page: from + i }));
  if (count <= 7) return pages(1, count);
  if (page <= 4) return [...pages(1, 5), { kind: 'gap', key: 'end' }, ...pages(count, count)];
  if (page >= count - 3) return [...pages(1, 1), { kind: 'gap', key: 'start' }, ...pages(count - 4, count)];
  return [
    ...pages(1, 1),
    { kind: 'gap', key: 'start' },
    ...pages(page - 1, page + 1),
    { kind: 'gap', key: 'end' },
    ...pages(count, count),
  ];
}

/**
 * Moves between pages of a long list or table: a `nav` landmark with labelled previous and next arrows and
 * numbered pages; the current page carries `aria-current="page"`. Arrows at either end are `aria-disabled`.
 * Emits `pageChange` with the requested page, so `[(page)]` binds both ways. Show "Showing 1–20 of 38" beside it.
 */
@Component({
  selector: 'ig-pagination',
  imports: [Icon],
  template: `
    <nav [attr.aria-label]="label()">
      <ul class="pagination">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            [attr.aria-disabled]="current() <= 1 ? 'true' : null"
            (click)="go(current() - 1)"
          >
            <ig-icon name="chevron-left" size="sm" />
          </button>
        </li>
        @for (slot of slots(); track slot.kind === 'page' ? slot.page : slot.key) {
          <li>
            @if (slot.kind === 'page') {
              <button
                type="button"
                [attr.aria-current]="slot.page === current() ? 'page' : null"
                (click)="go(slot.page)"
              >
                {{ slot.page }}
              </button>
            } @else {
              <span class="pagination__gap" aria-hidden="true">…</span>
            }
          </li>
        }
        <li>
          <button
            type="button"
            aria-label="Next page"
            [attr.aria-disabled]="current() >= count() ? 'true' : null"
            (click)="go(current() + 1)"
          >
            <ig-icon name="chevron-right" size="sm" />
          </button>
        </li>
      </ul>
    </nav>
  `,
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  /** The current page, starting at 1. */
  readonly page = input(1, { transform: numberAttribute });
  /** How many pages there are. */
  readonly pageCount = input.required({ transform: numberAttribute });
  /** The landmark's accessible name; name it after the list when a page has more than one. */
  readonly label = input('Pagination');

  /** The page the person asked for. */
  readonly pageChange = output<number>();

  protected readonly count = computed(() => Math.max(1, Math.floor(this.pageCount() || 1)));
  protected readonly current = computed(() =>
    Math.min(Math.max(1, Math.floor(this.page() || 1)), this.count()),
  );
  protected readonly slots = computed(() => pageSlots(this.current(), this.count()));

  protected go(page: number): void {
    if (page < 1 || page > this.count() || page === this.current()) return;
    this.pageChange.emit(page);
  }
}
