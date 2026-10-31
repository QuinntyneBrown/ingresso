import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type InlineMessageKind = 'help' | 'error';

/**
 * The small text under a control: muted help, or a danger error prefixed with ⚠. Give the host an `id` and
 * point the control's `aria-describedby` at it. Errors begin with the fix ("Enter a full address").
 */
@Component({
  selector: 'ig-inline-message',
  template: `<span [class]="kind() === 'error' ? 'field__error' : 'field__help'"><ng-content /></span>`,
  styleUrl: './inline-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineMessage {
  readonly kind = input<InlineMessageKind>('help');
}
