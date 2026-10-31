import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A full-page status message (404, 403, 500, offline): a large decorative code hidden from assistive
 * technology, or an icon (`[slot=icon]`) when there is no code, the heading, a message (`[slot=message]`)
 * and actions (`[slot=actions]`).
 */
@Component({
  selector: 'ig-status-page',
  template: `
    <div class="status-page">
      <div>
        @if (code()) {
          <div class="status-page__code" aria-hidden="true">{{ code() }}<span>.</span></div>
        } @else {
          <div class="status-page__icon" aria-hidden="true"><ng-content select="[slot=icon]" /></div>
        }
        <h1>{{ heading() }}</h1>
        <div class="status-page__message"><ng-content select="[slot=message]" /></div>
        <div class="empty__actions"><ng-content select="[slot=actions]" /></div>
      </div>
    </div>
  `,
  styleUrl: './status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
  /** The decorative status code. Leave it out and supply `[slot=icon]` instead. */
  readonly code = input<string>();
  readonly heading = input.required<string>();
}
