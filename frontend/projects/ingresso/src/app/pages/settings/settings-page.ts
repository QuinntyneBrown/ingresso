import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card, Check, Choice, FieldSet, Link } from 'components';
import { ThemePreference, ThemeStore } from '../../state/theme-store';

const CHOICES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Match my system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Settings: how ingresso looks. The choice applies at once and is kept on this device (L2-044). */
@Component({
  selector: 'ig-settings-page',
  imports: [Card, Check, Choice, FieldSet, Link, RouterLink],
  template: `
    <div class="page">
      <a ig-link variant="back" routerLink="/">Back to your apps</a>
      <section class="intro">
        <h1>Settings</h1>
        <p class="text-muted">How ingresso looks.</p>
      </section>
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly theme = inject(ThemeStore);
  protected readonly choices = CHOICES;
}
