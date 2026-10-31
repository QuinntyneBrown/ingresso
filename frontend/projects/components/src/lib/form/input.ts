import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Text input, textarea and select styling on the native element (`<input ig-input>`, `<textarea ig-input>`,
 * `<select ig-input>`), so reactive forms bind to it directly. `aria-invalid="true"` shows the invalid state;
 * `readonly` shows the sunken read-only state. Add the class `input--sm` or `input--lg` for the small or large size
 * (a class rather than an input, so it never shadows the native `size` attribute).
 */
@Component({
  selector: 'input[ig-input], textarea[ig-input], select[ig-input]',
  template: '<ng-content />',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {}
