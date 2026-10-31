import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StackGap = 'sm' | 'md' | 'lg';

/** Spaces its children vertically with a token gap; use it instead of margins on the children. */
@Component({
  selector: 'ig-stack',
  template: '<ng-content />',
  styleUrl: './stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class Stack {
  readonly gap = input<StackGap>('md');
  protected readonly classes = computed(() => (this.gap() === 'md' ? 'stack' : `stack stack--${this.gap()}`));
}
