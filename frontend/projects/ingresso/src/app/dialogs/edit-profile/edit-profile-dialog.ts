import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiError, Profile, PROFILE_API } from 'api';
import {
  Alert,
  Button,
  describedBy,
  DialogShell,
  ErrorSummary,
  FieldErrorItem,
  FormField,
  Input,
} from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const EDIT_PROFILE_TITLE_ID = 'ig-edit-profile-title';
const FORM_ID = 'edit-profile-form';
const NAME_ID = 'profile-display-name';

/**
 * "Edit your profile": the display name, with the email shown as text that can't change here (L2-117, ADR 0017).
 * Closes with the saved profile.
 */
@Component({
  selector: 'ig-edit-profile-dialog',
  imports: [Alert, Button, DialogShell, ErrorSummary, FormField, Input, ReactiveFormsModule],
  template: `
    <ig-dialog-shell title="Edit your profile" [titleId]="titleId">
      <p slot="description" class="description">How you appear in ingresso and to the apps you sign in to.</p>
      <form [id]="formId" class="body" [formGroup]="form" novalidate (ngSubmit)="submit()">
        @if (summary().length) {
          <ig-error-summary [errors]="summary()" />
        }
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t save your profile">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <ig-form-field
          label="Display name"
          optional
          [controlId]="nameId"
          hint="Shown in your greeting, and to apps that ask for your profile. Leave it empty to use your email."
          [error]="error()"
        >
          <input
            ig-input
            [id]="nameId"
            formControlName="displayName"
            autocomplete="name"
            [attr.aria-invalid]="error() ? 'true' : null"
            [attr.aria-describedby]="describedBy(nameId, true, !!error())"
          />
        </ig-form-field>
        <div class="email">
          <span class="email__label">Email</span>
          <p class="email__text">{{ profile.email }}. Your email can’t be changed here.</p>
        </div>
      </form>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="primary" type="submit" [attr.form]="formId" [busy]="busy()">
        {{ busy() ? 'Saving…' : 'Save changes' }}
      </button>
    </ig-dialog-shell>
  `,
  styles: `
    .description {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
    .body {
      display: grid;
      gap: var(--spacingVerticalL);
    }
    .email__label {
      font-weight: var(--fontWeightSemibold);
      font-size: var(--fontSizeBase300);
    }
    .email__text {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileDialog {
  protected readonly ref = inject<DialogRef<Profile>>(DialogRef);
  protected readonly profile = inject<Profile>(DIALOG_DATA);
  private readonly profiles = inject(PROFILE_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly titleId = EDIT_PROFILE_TITLE_ID;
  protected readonly formId = FORM_ID;
  protected readonly nameId = NAME_ID;
  protected readonly describedBy = describedBy;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = computed<FieldErrorItem[]>(() => {
    const message = this.error();
    return message ? [{ controlId: NAME_ID, message }] : [];
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    displayName: this.profile.displayName ?? '',
  });

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLInputElement>(`#${NAME_ID}`)?.focus());
  }

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.error.set(null);
    this.form.disable();
    this.ref.disableClose = true;
    this.profiles.update(this.form.getRawValue().displayName).subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.busy.set(false);
        this.form.enable();
        this.ref.disableClose = false;
        const message =
          error instanceof ApiError && error.kind === 'Validation'
            ? (error.fieldErrors['displayName']?.[0] ?? null)
            : null;
        if (message) {
          this.error.set(message);
          afterNextRender(
            () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
            { injector: this.injector },
          );
        } else {
          this.failed.set(true);
          revealAlert(this.host, this.injector);
        }
      },
    });
  }
}
