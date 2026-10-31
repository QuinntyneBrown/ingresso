import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A rounded-square app icon: one or two initials in white on the app's colour. Decorative next to the app's name. */
@Component({
  selector: 'ig-app-icon',
  template: `<span
    class="app-icon"
    [class]="'app-icon app-icon--' + size()"
    [style.background]="color()"
    aria-hidden="true"
    >{{ text() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .app-icon {
      display: inline-grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--borderRadiusXLarge);
      color: #fff;
      font-weight: var(--fontWeightSemibold);
      font-size: var(--fontSizeBase400);
      letter-spacing: -0.01em;
      line-height: 1;
      user-select: none;
    }
    .app-icon--lg {
      width: 3rem;
      height: 3rem;
      font-size: var(--fontSizeBase500);
    }
    .app-icon--sm {
      width: 2rem;
      height: 2rem;
      font-size: var(--fontSizeBase300);
      border-radius: var(--borderRadiusLarge);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIcon {
  readonly initial = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly text = computed(() => this.initial().trim().slice(0, 2).toUpperCase());
}
