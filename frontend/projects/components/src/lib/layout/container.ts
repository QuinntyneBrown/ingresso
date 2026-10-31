import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Caps content at the layout's max width and adds the responsive side margin. `narrow` caps it at 42rem. */
@Component({
  selector: 'ig-container',
  template: '<ng-content />',
  styleUrl: './container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'container',
    '[class.container--narrow]': 'narrow()',
  },
})
export class Container {
  readonly narrow = input(false, { transform: booleanAttribute });
}
