import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { Profile, PROFILE_API } from 'api';
import { Alert, Button, Card, Icon, List, ListItem, Skeleton } from 'components';

type Load = 'loading' | 'ready' | 'failed';

/** What Edit profile hands the page: the profile to edit and the button focus returns to. */
export interface ProfileEdit {
  profile: Profile;
  trigger: HTMLElement;
}

/** Settings → Profile: the display name and email, with Edit profile (L2-117, ADR 0017). */
@Component({
  selector: 'ig-profile-card',
  imports: [Alert, Button, Card, Icon, List, ListItem, Skeleton],
  template: `
    <section ig-card title="Profile">
      @if (profile(); as current) {
        <button
          slot="actions"
          ig-button
          type="button"
          (click)="edit.emit({ profile: current, trigger: $any($event.currentTarget) })"
        >
          <ig-icon name="edit" />Edit profile
        </button>
      }
      <p class="lead">Apps you sign in to with ingresso see these when they ask.</p>
      @switch (load()) {
        @case ('loading') {
          <div class="loading" aria-busy="true" aria-label="Loading your profile">
            <ig-skeleton /><ig-skeleton />
          </div>
        }
        @case ('failed') {
          <ig-alert kind="danger" title="We couldn’t load your profile" announce="alert" [actions]="retry">
            Try again in a moment.
          </ig-alert>
        }
        @default {
          @if (profile(); as current) {
            <ul ig-list surface aria-label="Your profile">
              <li
                ig-list-item
                title="Display name"
                [meta]="current.displayName ?? 'Not set. Add one to be greeted by name.'"
              ></li>
              <li ig-list-item title="Email" [meta]="current.email"></li>
            </ul>
          }
        }
      }
    </section>
  `,
  styles: `
    .lead {
      color: var(--colorNeutralForeground2);
      margin-bottom: var(--spacingVerticalL);
    }
    .loading {
      display: grid;
      gap: var(--spacingVerticalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCard implements OnInit {
  private readonly profiles = inject(PROFILE_API);
  protected readonly load = signal<Load>('loading');
  protected readonly profile = signal<Profile | null>(null);
  protected readonly retry = [{ label: 'Try again', run: () => this.reload() }];

  /** Edit profile was chosen; the page opens the dialog. */
  readonly edit = output<ProfileEdit>();

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.load.set('loading');
    this.profiles.get().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.load.set('ready');
      },
      error: () => this.load.set('failed'),
    });
  }

  /** Shows a profile just saved, without loading it again. */
  show(profile: Profile): void {
    this.profile.set(profile);
    this.load.set('ready');
  }
}
