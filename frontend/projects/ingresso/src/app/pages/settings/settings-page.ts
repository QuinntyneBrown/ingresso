import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Card, Check, Choice, FieldSet, Link, ToastService } from 'components';
import { AppDialogs } from '../../state/app-dialogs';
import { SessionStore } from '../../state/session-store';
import { ThemePreference, ThemeStore } from '../../state/theme-store';
import { AppAction, AppsCard } from './apps-card';
import { ConnectedAppAction, ConnectedAppsCard } from './connected-apps-card';
import { DeviceAction, DevicesCard } from './devices-card';
import { ProfileCard, ProfileEdit } from './profile-card';

const CHOICES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Match my system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Settings: the person's profile (L2-117), how ingresso looks, applied at once and kept on this device (L2-044), and
 * for administrators the apps that sign in with ingresso (L2-104).
 */
@Component({
  selector: 'ig-settings-page',
  imports: [
    AppsCard,
    Button,
    Card,
    Check,
    Choice,
    ConnectedAppsCard,
    DevicesCard,
    FieldSet,
    Link,
    ProfileCard,
    RouterLink,
  ],
  template: `
    <div class="page">
      <a ig-link variant="back" routerLink="/">Back to your apps</a>
      <section class="intro">
        <h1>Settings</h1>
        <p class="text-muted">
          {{
            administrator()
              ? 'Your profile, how ingresso looks, your connected apps, devices and activity, and the apps that sign in with it.'
              : 'Your profile, how ingresso looks, your connected apps, devices and activity.'
          }}
        </p>
      </section>
      <div class="stack">
        <ig-profile-card (edit)="editProfile($event)" />
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
        <ig-connected-apps-card (revoke)="revokeAccess($event)" />
        <ig-devices-card (end)="endSessions($event)" />
        <section ig-card title="Activity">
          <a slot="actions" ig-button routerLink="/settings/activity">View activity</a>
          <p class="text-muted">Sign-ins and other security events on your account.</p>
        </section>
        @if (administrator()) {
          <ig-apps-card
            (register)="register($event)"
            (edit)="edit($event)"
            (rotateSecret)="rotateSecret($event)"
            (delete)="delete($event)"
          />
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
  private readonly profileCard = viewChild(ProfileCard);
  private readonly connectedAppsCard = viewChild(ConnectedAppsCard);
  private readonly devicesCard = viewChild(DevicesCard);

  /** Edit the profile; the saved name is announced and shown in the card and the header (L2-117). */
  protected editProfile({ profile, trigger }: ProfileEdit): void {
    this.dialogs.openEditProfile(profile, trigger).subscribe((saved) => {
      if (!saved) return;
      this.profileCard()?.show(saved);
      this.session.refresh();
      this.toasts.show({
        kind: 'success',
        title: 'Profile saved',
        text: saved.displayName
          ? `Apps that ask for your profile now see ${saved.displayName}.`
          : 'Apps that ask for your profile now see your email.',
      });
    });
  }

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

  /** Edit an app; the saved app is announced and the list reloads (L2-112). */
  protected edit({ app, trigger }: AppAction): void {
    this.dialogs.openEditApp(app, trigger).subscribe((saved) => {
      if (!saved) return;
      this.toasts.show({ kind: 'success', title: 'App saved', text: `${saved.client.name} was saved.` });
      this.appsCard()?.reload();
    });
  }

  /** Rotate a confidential app's secret: the new one is shown once, then a toast confirms it (L2-113). */
  protected rotateSecret({ app, trigger }: AppAction): void {
    this.dialogs.openRotateSecret(app, trigger).subscribe((rotated) => {
      if (!rotated) return;
      this.dialogs.openClientSecret(rotated, trigger, true).subscribe(() =>
        this.toasts.show({
          kind: 'success',
          title: 'Secret rotated',
          text: `${app.name}’s old secret no longer works.`,
        }),
      );
    });
  }

  /** Delete an app once its name is typed; a toast confirms it and the list reloads (L2-115). */
  protected delete({ app, trigger }: AppAction): void {
    this.dialogs.openDeleteClient(app, trigger).subscribe((deleted) => {
      if (!deleted) return;
      this.toasts.show({
        kind: 'success',
        title: 'App deleted',
        text: `${app.name} can no longer sign anyone in.`,
      });
      this.appsCard()?.reload();
    });
  }

  /** Revoke a connected app's access once confirmed; a toast confirms it and the list reloads (L2-129). */
  protected revokeAccess({ app, trigger }: ConnectedAppAction): void {
    this.dialogs.openRevokeAccess(app, trigger).subscribe((revoked) => {
      if (!revoked) return;
      this.toasts.show({
        kind: 'success',
        title: 'Access revoked',
        text: `${app.name} has to ask again next time.`,
      });
      this.connectedAppsCard()?.reload();
    });
  }

  /** End another device's session, or all of them, once confirmed; a toast confirms it and the list reloads (L2-133, L2-134). */
  protected endSessions({ device, others, trigger }: DeviceAction): void {
    this.dialogs.openEndSession({ device, others }, trigger).subscribe((ended) => {
      if (!ended) return;
      this.toasts.show(
        device === 'others'
          ? {
              kind: 'success',
              title: 'Signed out of other devices',
              text: 'Only this device is signed in now.',
            }
          : { kind: 'success', title: 'Session ended', text: `${device.device} is signed out.` },
      );
      this.devicesCard()?.reload();
    });
  }
}
