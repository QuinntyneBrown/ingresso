import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card, Check, Choice, FieldSet, Link, ToastService } from 'components';
import { AppDialogs } from '../../state/app-dialogs';
import { SessionStore } from '../../state/session-store';
import { ThemePreference, ThemeStore } from '../../state/theme-store';
import { AppsCard } from './apps-card';

const CHOICES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Match my system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Settings: how ingresso looks, applied at once and kept on this device (L2-044), and for administrators the apps
 * that sign in with ingresso (L2-104).
 */
@Component({
  selector: 'ig-settings-page',
  imports: [AppsCard, Card, Check, Choice, FieldSet, Link, RouterLink],
  template: `
    <div class="page">
      <a ig-link variant="back" routerLink="/">Back to your apps</a>
      <section class="intro">
        <h1>Settings</h1>
        <p class="text-muted">
          {{
            administrator() ? 'How ingresso looks, and the apps that sign in with it.' : 'How ingresso looks.'
          }}
        </p>
      </section>
      <div class="stack">
        <ig-card>
          <ig-field-set legend="Appearance" controlId="theme">
            @for (choice of choices; track choice.value) {
              <label ig-choice>
                <input
                  ig-check
                  type="radio"
                  name="theme"
                  [value]="choice.value"
                  [checked]="theme.preference() === choice.value"
                  (change)="theme.choose(choice.value)"
                />{{ choice.label }}
              </label>
            }
          </ig-field-set>
        </ig-card>
        @if (administrator()) {
          <ig-apps-card (register)="register($event)" />
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly theme = inject(ThemeStore);
  protected readonly choices = CHOICES;
  private readonly session = inject(SessionStore);
  protected readonly administrator = computed(() => this.session.user()?.role === 'admin');
  private readonly dialogs = inject(AppDialogs);
  private readonly toasts = inject(ToastService);
  private readonly appsCard = viewChild(AppsCard);

  /** Register an app; a new app is announced and the list reloads (L2-105). */
  protected register(event: Event): void {
    const trigger = event.currentTarget as HTMLElement;
    this.dialogs.openRegisterApp(trigger).subscribe((registered) => {
      if (!registered) return;
      if (registered.clientSecret) {
        // A confidential app's secret is shown once, then the list reloads (L2-106).
        this.dialogs.openClientSecret(registered, trigger).subscribe(() => this.appsCard()?.reload());
        return;
      }
      this.toasts.show({
        kind: 'success',
        title: 'App registered',
        text: `${registered.client.name} can sign people in with ingresso.`,
      });
      this.appsCard()?.reload();
    });
  }
}
