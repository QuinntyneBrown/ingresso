import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'md' | 'lg';

/**
 * An indeterminate busy indicator for short, unknown waits. Announces `label` ("Loading apps") as a status;
 * the ring stops under reduced motion. Buttons show their own spinner through `busy`.
 */
@Component({
  selector: 'ig-spinner',
  template: `<span [class]="size() === 'lg' ? 'spinner spinner--lg' : 'spinner'" role="status"
    ><span class="visually-hidden">{{ label() }}</span></span
  >`,
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  readonly label = input.required<string>();
  readonly size = input<SpinnerSize>('md');
}
