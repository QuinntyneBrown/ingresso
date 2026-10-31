import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TileInput, TileSize } from 'api';
import { AppIcon, Check, Choice, describedBy, FieldSet, FormField, Input } from 'components';
import { APP_COLORS, initialsOf } from '../../shared/colors';

export const APP_FORM_ID = 'app-form';

const toUrl = (value: string): string => {
  const trimmed = value.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/** The fields of an app, shared by the add-app and edit-app dialogs. Submit it with a `form="app-form"` button. */
@Component({
  selector: 'ig-app-form',
  imports: [AppIcon, Check, Choice, FieldSet, FormField, Input, ReactiveFormsModule],
  template: `
    <form [id]="formId" class="app-form" [formGroup]="form" novalidate (ngSubmit)="submit()">
      <div class="app-form__preview">
        <ig-app-icon [initial]="form.controls.initial.value" [color]="form.controls.color.value" size="lg" />
        <span class="app-form__preview-name">{{ form.controls.name.value || 'New app' }}</span>
      </div>
      <ig-form-field
        label="Name"
        controlId="app-name"
        [error]="
          errors()['name'] ??
          (touched('name') && form.controls.name.invalid ? 'Enter a name for the app.' : null)
        "
      >
        <input
          ig-input
          id="app-name"
          formControlName="name"
          maxlength="60"
          autocomplete="off"
          cdkFocusInitial
          [attr.aria-invalid]="touched('name') && form.controls.name.invalid ? 'true' : null"
          [attr.aria-describedby]="
            describedBy('app-name', false, touched('name') && form.controls.name.invalid)
          "
        />
      </ig-form-field>
      <ig-form-field
        label="Address"
        controlId="app-url"
        hint="Where the tile opens, such as https://billing.example.com."
        [error]="
          errors()['url'] ??
          (touched('url') && form.controls.url.invalid ? 'Enter a web address for the app.' : null)
        "
      >
        <input
          ig-input
          id="app-url"
          formControlName="url"
          inputmode="url"
          autocomplete="off"
          [attr.aria-invalid]="touched('url') && form.controls.url.invalid ? 'true' : null"
          [attr.aria-describedby]="
            describedBy('app-url', true, !!errors()['url'] || (touched('url') && form.controls.url.invalid))
          "
        />
      </ig-form-field>
      <ig-form-field label="Description" controlId="app-description" optional>
        <input
          ig-input
          id="app-description"
          formControlName="description"
          maxlength="140"
          autocomplete="off"
        />
      </ig-form-field>
      <ig-form-field label="Category" controlId="app-category" optional>
        <input ig-input id="app-category" formControlName="category" maxlength="40" autocomplete="off" />
      </ig-form-field>
      <ig-field-set legend="Colour" controlId="app-color">
        <div class="app-form__choices">
          @for (color of colors; track color.value) {
            <label ig-choice>
              <input ig-check type="radio" formControlName="color" [value]="color.value" />{{ color.label }}
            </label>
          }
        </div>
      </ig-field-set>
      <ig-form-field
        label="Initials"
        controlId="app-initial"
        hint="One or two characters shown in the icon."
        [error]="touched('initial') && form.controls.initial.invalid ? 'Enter one or two characters.' : null"
      >
        <input
          ig-input
          id="app-initial"
          formControlName="initial"
          maxlength="2"
          autocomplete="off"
          [attr.aria-invalid]="touched('initial') && form.controls.initial.invalid ? 'true' : null"
          [attr.aria-describedby]="
            describedBy('app-initial', true, touched('initial') && form.controls.initial.invalid)
          "
          (input)="initialEdited = true"
        />
      </ig-form-field>
      <ig-field-set legend="Tile size" controlId="app-size">
        <div class="app-form__choices">
          <label ig-choice card hint="Shows the description and when you last opened it">
            <input ig-check type="radio" formControlName="size" value="large" />Large
          </label>
          <label ig-choice card hint="Icon, name and address only">
            <input ig-check type="radio" formControlName="size" value="small" />Compact
          </label>
        </div>
      </ig-field-set>
    </form>
  `,
  styles: `
    .app-form {
      display: grid;
      gap: var(--spacingVerticalL);
    }
    .app-form__preview {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalM);
    }
    .app-form__preview-name {
      font: var(--ig-text-h4);
    }
    .app-form__choices {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
      gap: var(--spacingHorizontalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Values to start from; absent for a new app. */
  readonly value = input<Partial<TileInput> | null>(null);
  /** Field errors from the server, by lower-case field name. */
  readonly errors = input<Record<string, string>>({});
  readonly disabled = input(false);

  readonly submitted = output<TileInput>();

  protected readonly formId = APP_FORM_ID;
  protected readonly colors = APP_COLORS;
  protected readonly describedBy = describedBy;
  protected initialEdited = false;
  private attempted = false;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    color: new FormControl(APP_COLORS[0].value, { nonNullable: true }),
    initial: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    size: new FormControl<TileSize>('small', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (!v) return;
      this.form.patchValue({
        name: v.name ?? '',
        url: v.url ?? '',
        description: v.description ?? '',
        category: v.category ?? '',
        color: v.color ?? APP_COLORS[0].value,
        initial: v.initial ?? initialsOf(v.name ?? ''),
        size: v.size ?? 'small',
      });
      this.initialEdited = !!v.initial;
    });
    effect(() =>
      this.disabled() ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false }),
    );
    this.form.controls.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => {
      if (!this.initialEdited) this.form.controls.initial.setValue(initialsOf(name), { emitEvent: false });
    });
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLInputElement>('#app-name')?.focus());
  }

  protected touched(name: 'name' | 'url' | 'initial'): boolean {
    return this.attempted || this.form.controls[name].touched;
  }

  protected submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name.trim(),
      url: toUrl(v.url),
      description: v.description.trim() || null,
      category: v.category.trim() || null,
      color: v.color,
      initial: v.initial.trim().toUpperCase(),
      size: v.size,
    });
  }
}
