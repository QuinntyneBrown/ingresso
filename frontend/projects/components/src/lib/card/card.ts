import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

/**
 * A bordered surface that groups related content, such as a settings section. Put it on the element whose
 * semantics fit (`<section ig-card>`, `<article ig-card>`) or use `<ig-card>`. `title` renders the
 * `card__title` heading and labels the card; `[slot=actions]` sits beside it, `[slot=footer]` closes the card.
 * Cards are never nested, and a clickable card holds one real link or button: the card is not the control.
 */
@Component({
  selector: 'ig-card, [ig-card]',
  template: `
    <div class="card__header">
      @if (title()) {
        @switch (level()) {
          @case (3) {
            <h3 class="card__title" [id]="titleId">{{ title() }}</h3>
          }
          @case (4) {
            <h4 class="card__title" [id]="titleId">{{ title() }}</h4>
          }
          @default {
            <h2 class="card__title" [id]="titleId">{{ title() }}</h2>
          }
        }
      }
      <div class="card__actions"><ng-content select="[slot=actions]" /></div>
    </div>
    <ng-content />
    <div class="card__footer"><ng-content select="[slot=footer]" /></div>
  `,
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-labelledby]': 'title() ? titleId : null',
  },
})
export class Card {
  /** The card's heading; also its accessible name. */
  readonly title = input<string>();
  /** Heading level of the title, to fit the page outline. */
  readonly level = input<2 | 3 | 4>(2);
  /** Removes the padding, for edge-to-edge content such as a list. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** Lifts on hover; use only when the card holds one link or button. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Accent border for the chosen card in a set. */
  readonly selected = input(false, { transform: booleanAttribute });

  protected readonly titleId = `ig-card-title-${nextId++}`;
  protected readonly classes = computed(() =>
    [
      'card',
      this.flush() ? 'card--flush' : '',
      this.interactive() ? 'card--interactive' : '',
      this.selected() ? 'card--selected' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
