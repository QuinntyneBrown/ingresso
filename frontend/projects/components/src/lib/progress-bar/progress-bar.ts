import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressBarKind = 'brand' | 'success' | 'danger';

/**
 * Shows how far known-length work has got. `label` names the task. A `value` of `null` is indeterminate
 * (no `aria-valuenow`); it holds still under reduced motion.
 */
@Component({
  selector: 'ig-progress-bar',
  template: `<div
    [class]="classes()"
    role="progressbar"
    [attr.aria-label]="label()"
    [attr.aria-valuenow]="value()"
    [attr.aria-valuemin]="value() === null ? null : 0"
    [attr.aria-valuemax]="value() === null ? null : max()"
  >
    <div class="progress__bar" [style.--value]="percent()"></div>
  </div>`,
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  readonly label = input.required<string>();
  readonly value = input<number | null>(null);
  readonly max = input(100);
  readonly kind = input<ProgressBarKind>('brand');

  protected readonly percent = computed(() => {
    const value = this.value();
    if (value === null) {
      return null;
    }
    const max = this.max() > 0 ? this.max() : 100;
    return `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
  });

  protected readonly classes = computed(() =>
    [
      'progress',
      this.value() === null ? 'progress--indeterminate' : '',
      this.kind() === 'brand' ? '' : `progress--${this.kind()}`,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
