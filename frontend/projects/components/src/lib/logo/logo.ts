import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/**
 * The ingresso mark (a door with a wedge of ink) with an optional "ingresso" wordmark. The mark is decorative
 * when the wordmark is shown; pass `label` when the mark stands alone.
 */
@Component({
  selector: 'ig-logo',
  template: `
    <svg
      class="logo__mark"
      viewBox="0 6 34 34"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
    >
      <defs>
        <mask [id]="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
          <rect x="0" y="0" width="40" height="40" fill="white" />
          <circle cx="21" cy="14.2" r="2.4" fill="black" />
          <rect x="19" y="19" width="4" height="17" rx="1" fill="black" />
        </mask>
      </defs>
      <path d="M12 35V17a9 9 0 0 1 18 0v18z" class="logo__door" [attr.mask]="'url(#' + maskId + ')'" />
      <path d="M10.4 16.6 4 12.6v25.8l6.4-3.4z" class="logo__wedge" />
    </svg>
    @if (wordmark()) {
      <span class="logo__word">ingresso</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--colorNeutralForeground1);
    }
    .logo__mark {
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    :host([size='lg']) .logo__mark {
      width: 3rem;
      height: 3rem;
    }
    .logo__door {
      fill: var(--ig-color-brand);
    }
    .logo__wedge {
      fill: var(--colorNeutralForeground1);
    }
    .logo__word {
      font-weight: var(--fontWeightSemibold);
      font-size: 1.25rem;
      letter-spacing: -0.045em;
      line-height: 1;
    }
  `,
  host: { '[attr.size]': 'size()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  protected readonly maskId = `ig-logo-door-${nextId++}`;

  readonly wordmark = input(true, { transform: booleanAttribute });
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input<string>();
}
