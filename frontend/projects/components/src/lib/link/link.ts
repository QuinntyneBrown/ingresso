import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

export type LinkVariant = 'inline' | 'back';

/**
 * Link styles for a native `<a href>` (`<a ig-link href="/directory">`). Always underlined. `back` adds the
 * leading arrow of the "Back to your apps" link; `external` opens in a new tab with `rel="noopener noreferrer"`
 * and announces "(opens in a new tab)".
 */
@Component({
  selector: 'a[ig-link]',
  imports: [Icon],
  template: `@if (variant() === 'back') {
      <ig-icon name="arrow-left" size="sm" />
    }
    <ng-content />
    @if (external()) {
      <span class="link__external"><ig-icon name="external" size="sm" /></span
      ><span class="visually-hidden"> (opens in a new tab)</span>
    }`,
  styleUrl: './link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.target]': 'external() ? "_blank" : null',
    '[attr.rel]': 'external() ? "noopener noreferrer" : null',
  },
})
export class Link {
  readonly variant = input<LinkVariant>('inline');
  readonly external = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    [this.variant() === 'back' ? 'back' : '', this.external() ? 'link--external' : '']
      .filter(Boolean)
      .join(' '),
  );
}
