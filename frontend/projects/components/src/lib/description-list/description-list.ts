import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One term and its value. `mono` sets the value in the monospace face, for addresses and identifiers. */
export interface DescriptionListItem {
  term: string;
  description: string;
  mono?: boolean;
}

/**
 * Facts about one thing as key-value pairs, on a native `<dl>`: an app's address, when it was last opened.
 * Terms are muted nouns; values show relative times rather than raw timestamps.
 */
@Component({
  selector: 'ig-description-list',
  template: `
    <dl class="dl">
      @for (item of items(); track $index) {
        <dt>{{ item.term }}</dt>
        <dd [class.mono]="item.mono">{{ item.description }}</dd>
      }
    </dl>
  `,
  styleUrl: './description-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionList {
  readonly items = input.required<DescriptionListItem[]>();
}
