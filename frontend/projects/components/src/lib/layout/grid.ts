import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A grid on the layout's responsive columns (4, 8, 12) and gutter. `auto` instead fills the row with as
 * many 18rem-minimum columns as fit.
 */
@Component({
  selector: 'ig-grid',
  template: '<ng-content />',
  styleUrl: './grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'grid',
    '[class.grid--auto]': 'auto()',
  },
})
export class Grid {
  readonly auto = input(false, { transform: booleanAttribute });
}
