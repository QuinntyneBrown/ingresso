import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AppRegistered } from 'api';
import { Alert, Button, DialogShell, FormField, Input } from 'components';

export const CLIENT_SECRET_TITLE_ID = 'ig-client-secret-title';

type Copyable = 'client ID' | 'client secret';

/**
 * A new confidential app's client ID and secret, each with a Copy button (L2-106). The secret exists only in this
 * dialog's data: once it closes, ingresso can never show it again.
 */
@Component({
  selector: 'ig-client-secret-dialog',
  imports: [Alert, Button, DialogShell, FormField, Input],
  template: `
    <ig-dialog-shell [title]="data.client.name + ' is registered'" [titleId]="titleId">
      <p slot="description" class="description">Copy its client ID and secret into the app.</p>
      <div class="body">
        <ig-alert kind="warning" title="You won’t see this secret again">
          Store it in the app’s settings now. If it’s lost, the app will need a new one.
        </ig-alert>
        <ig-form-field label="Client ID" controlId="client-id">
          <div class="copy-row">
            <input
              ig-input
              id="client-id"
              class="value"
              type="text"
              readonly
              [value]="data.client.clientId"
            />
            <button
              ig-button
              type="button"
              aria-label="Copy client ID"
              (click)="copy('client ID', data.client.clientId)"
            >
              {{ copied() === 'client ID' ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </ig-form-field>
        <ig-form-field label="Client secret" controlId="client-secret">
          <div class="copy-row">
            <input
              ig-input
              id="client-secret"
              class="value"
              type="text"
              readonly
              [value]="data.clientSecret"
            />
            <button
              ig-button
              type="button"
              aria-label="Copy client secret"
              (click)="copy('client secret', data.clientSecret!)"
            >
              {{ copied() === 'client secret' ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </ig-form-field>
        <p class="visually-hidden" role="status">{{ copied() ? capitalise(copied()!) + ' copied' : '' }}</p>
      </div>
      <button slot="footer" ig-button appearance="primary" type="button" (click)="ref.close()">Done</button>
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
    .copy-row {
      display: flex;
      gap: var(--spacingHorizontalS);
    }
    .value {
      flex: 1;
      min-width: 0;
      font-family: var(--fontFamilyMonospace);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientSecretDialog {
  protected readonly ref = inject(DialogRef);
  protected readonly data = inject<AppRegistered>(DIALOG_DATA);
  private readonly clipboard = inject(Clipboard);

  protected readonly titleId = CLIENT_SECRET_TITLE_ID;
  protected readonly copied = signal<Copyable | null>(null);

  protected copy(what: Copyable, value: string): void {
    if (this.clipboard.copy(value)) this.copied.set(what);
  }

  protected capitalise(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
  }
}
