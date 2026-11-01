import { DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiError, AppRegistered, AppRegistration, CLIENTS_API } from 'api';
import {
  Alert,
  Button,
  Check,
  Choice,
  describedBy,
  DialogShell,
  ErrorSummary,
  FieldErrorItem,
  FieldSet,
  FormField,
  Input,
} from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const REGISTER_APP_TITLE_ID = 'ig-register-app-title';
const FORM_ID = 'register-app-form';

type Field = 'name' | 'redirectUris' | 'postLogoutRedirectUris' | 'frontChannelLogoutUri';

/** The fields in page order, with the control each error focuses. */
const FIELDS: { field: Field; controlId: string }[] = [
  { field: 'name', controlId: 'client-name' },
  { field: 'redirectUris', controlId: 'client-redirects' },
  { field: 'postLogoutRedirectUris', controlId: 'client-logouts' },
  { field: 'frontChannelLogoutUri', controlId: 'client-front-channel' },
];

const lines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * "Register an app": registers an app that signs in with ingresso, with the CLI's rules and messages (L2-105).
 * Closes with the registration, which carries a confidential app's secret (L2-106).
 */
@Component({
  selector: 'ig-register-app-dialog',
  imports: [
    Alert,
    Button,
    Check,
    Choice,
    DialogShell,
    ErrorSummary,
    FieldSet,
    FormField,
    Input,
    ReactiveFormsModule,
  ],
  template: `
    <ig-dialog-shell title="Register an app" [titleId]="titleId">
      <p slot="description" class="description">Let an app sign people in with ingresso.</p>
      <form [id]="formId" class="body" [formGroup]="form" novalidate (ngSubmit)="submit()">
        @if (summary().length) {
          <ig-error-summary [errors]="summary()" />
        }
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t register the app">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <ig-form-field
          label="Name"
          controlId="client-name"
          hint="Shown on ingresso’s sign-in page."
          [error]="errors()['name'] ?? null"
        >
          <input
            ig-input
            id="client-name"
            formControlName="name"
            autocomplete="off"
            [attr.aria-invalid]="errors()['name'] ? 'true' : null"
            [attr.aria-describedby]="describedBy('client-name', true, !!errors()['name'])"
          />
        </ig-form-field>
        <ig-form-field
          label="Redirect addresses"
          controlId="client-redirects"
          hint="One per line. Where ingresso sends people back after they sign in."
          [error]="errors()['redirectUris'] ?? null"
        >
          <textarea
            ig-input
            id="client-redirects"
            formControlName="redirectUris"
            rows="2"
            [attr.aria-invalid]="errors()['redirectUris'] ? 'true' : null"
            [attr.aria-describedby]="describedBy('client-redirects', true, !!errors()['redirectUris'])"
          ></textarea>
        </ig-form-field>
        <ig-form-field
          label="Sign-out return addresses"
          controlId="client-logouts"
          optional
          hint="One per line. Where the app may send people after signing out."
          [error]="errors()['postLogoutRedirectUris'] ?? null"
        >
          <textarea
            ig-input
            id="client-logouts"
            formControlName="postLogoutRedirectUris"
            rows="2"
            [attr.aria-invalid]="errors()['postLogoutRedirectUris'] ? 'true' : null"
            [attr.aria-describedby]="
              describedBy('client-logouts', true, !!errors()['postLogoutRedirectUris'])
            "
          ></textarea>
        </ig-form-field>
        <ig-form-field
          label="Front-channel sign-out address"
          controlId="client-front-channel"
          optional
          hint="ingresso opens it to sign people out of the app when they sign out of ingresso."
          [error]="errors()['frontChannelLogoutUri'] ?? null"
        >
          <input
            ig-input
            id="client-front-channel"
            formControlName="frontChannelLogoutUri"
            inputmode="url"
            autocomplete="off"
            [attr.aria-invalid]="errors()['frontChannelLogoutUri'] ? 'true' : null"
            [attr.aria-describedby]="
              describedBy('client-front-channel', true, !!errors()['frontChannelLogoutUri'])
            "
          />
        </ig-form-field>
        @if (scopes().length) {
          <ig-field-set legend="APIs it can call (optional)" controlId="client-scopes">
            @for (scope of scopes(); track scope.value) {
              <label ig-choice>
                <input
                  ig-check
                  type="checkbox"
                  [value]="scope.value"
                  [checked]="chosen().has(scope.value)"
                  [disabled]="busy()"
                  (change)="toggle(scope.value)"
                />{{ scope.label }}
              </label>
            }
          </ig-field-set>
        }
        <ig-field-set legend="Type" controlId="client-type">
          <label ig-choice>
            <input ig-check type="radio" formControlName="confidential" [value]="false" />Public — runs in a
            browser or on a device and can’t keep a secret
          </label>
          <label ig-choice>
            <input ig-check type="radio" formControlName="confidential" [value]="true" />Confidential — runs
            on a server and keeps a secret
          </label>
        </ig-field-set>
      </form>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="primary" type="submit" [attr.form]="formId" [busy]="busy()">
        {{ busy() ? 'Registering…' : 'Register app' }}
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterAppDialog implements OnInit {
  protected readonly ref = inject<DialogRef<AppRegistered>>(DialogRef);
  private readonly clients = inject(CLIENTS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly summaryRef = viewChild(ErrorSummary);

  protected readonly titleId = REGISTER_APP_TITLE_ID;
  protected readonly formId = FORM_ID;
  protected readonly describedBy = describedBy;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Partial<Record<Field, string>>>({});
  protected readonly scopes = signal<{ value: string; label: string }[]>([]);
  protected readonly chosen = signal(new Set<string>());

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: '',
    redirectUris: '',
    postLogoutRedirectUris: '',
    frontChannelLogoutUri: '',
    confidential: false,
  });

  protected readonly summary = computed<FieldErrorItem[]>(() =>
    FIELDS.filter(({ field }) => this.errors()[field]).map(({ field, controlId }) => ({
      controlId,
      message: this.errors()[field]!,
    })),
  );

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLInputElement>('#client-name')?.focus());
  }

  ngOnInit(): void {
    this.clients.resources().subscribe({
      next: (resources) =>
        this.scopes.set(
          resources.flatMap((r) =>
            r.scopes.map((scope) => ({ value: scope, label: `${r.name} · ${scope}` })),
          ),
        ),
      error: () => this.scopes.set([]),
    });
  }

  protected toggle(scope: string): void {
    const next = new Set(this.chosen());
    if (!next.delete(scope)) next.add(scope);
    this.chosen.set(next);
  }

  protected submit(): void {
    if (this.busy()) return;
    const value = this.form.getRawValue();
    const registration: AppRegistration = {
      name: value.name.trim(),
      redirectUris: lines(value.redirectUris),
      postLogoutRedirectUris: lines(value.postLogoutRedirectUris),
      frontChannelLogoutUri: value.frontChannelLogoutUri.trim() || null,
      scopes: [...this.chosen()],
      confidential: value.confidential,
    };
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.form.disable();
    this.ref.disableClose = true;
    this.clients.register(registration).subscribe({
      next: (registered) => this.ref.close(registered),
      error: (error: unknown) => {
        this.busy.set(false);
        this.form.enable();
        this.ref.disableClose = false;
        if (
          error instanceof ApiError &&
          error.kind === 'Validation' &&
          Object.keys(error.fieldErrors).length
        ) {
          this.showFieldErrors(error.fieldErrors);
        } else if (error instanceof ApiError && error.kind === 'Conflict') {
          this.showFieldErrors({ name: [`An app named ${registration.name} is already registered.`] });
        } else {
          this.failed.set(true);
          revealAlert(this.host, this.injector);
        }
      },
    });
  }

  /** Server keys such as `redirectUris[1]` belong to their field; each field shows its first message. */
  private showFieldErrors(fieldErrors: Record<string, string[]>): void {
    const errors: Partial<Record<Field, string>> = {};
    for (const [key, messages] of Object.entries(fieldErrors)) {
      const field = key.split('[')[0] as Field;
      if (FIELDS.some((f) => f.field === field) && !errors[field]) errors[field] = messages[0];
    }
    this.errors.set(errors);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
