import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * An on/off setting that applies immediately (`<ig-switch [(checked)]="large">Show recent tiles larger</ig-switch>`).
 * Renders `button[role=switch]` with `aria-checked`; the projected text is its label. Implements
 * `ControlValueAccessor`, so `formControlName` and `ngModel` bind to it. If the person must press Save, use a checkbox.
 */
@Component({
  selector: 'ig-switch',
  template: `<button
      class="switch__track"
      type="button"
      role="switch"
      [id]="switchId()"
      [attr.aria-checked]="checked()"
      [attr.aria-labelledby]="switchId() + '-label'"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (blur)="onTouched()"
    >
      <span class="switch__thumb"></span></button
    ><label class="switch__label" [id]="switchId() + '-label'" [for]="switchId()"><ng-content /></label>`,
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
  host: {
    class: 'switch',
    '[class.switch--disabled]': 'isDisabled()',
  },
})
export class Switch implements ControlValueAccessor {
  /** Whether the setting is on. Two-way bindable as `[(checked)]`. */
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The id of the inner `button[role=switch]`; generated when not set. */
  readonly switchId = input(`ig-switch-${nextId++}`);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.checked.set(!this.checked());
    this.onChange(this.checked());
  }

  writeValue(value: unknown): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
