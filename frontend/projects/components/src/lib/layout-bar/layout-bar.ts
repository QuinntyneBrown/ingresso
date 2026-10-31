import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const MESSAGES = {
  editing: 'Drag a tile to move it, or drag its corner to resize it. Changes save as you go.',
  unavailable: 'Widen the window to at least 1024 pixels to edit the layout.',
} as const;

/**
 * The banner shown while the dashboard is in edit mode: a polite `role="status"` message that says what the
 * mode does and that changes save as they go, plus the actions projected into it (Reset layout as a ghost
 * `sm` button, Done as the one primary `sm` button). `unavailable` explains why layout editing is off on a
 * narrow window and hides the actions. Focus stays where it was when the bar appears.
 */
@Component({
  selector: 'ig-layout-bar',
  template: `
    <div class="layout-bar" [class.layout-bar--unavailable]="unavailable()" role="status">
      <p class="layout-bar__message">{{ text() }}</p>
      @if (!unavailable()) {
        <div class="cluster layout-bar__actions"><ng-content /></div>
      }
    </div>
  `,
  styleUrl: './layout-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutBar {
  /** Edit layout is unavailable (the window is narrower than 1024 pixels): explains why and shows no actions. */
  readonly unavailable = input(false, { transform: booleanAttribute });
  /** Replaces the default message for the current variant. */
  readonly message = input<string>();

  protected readonly text = computed(
    () => this.message() || (this.unavailable() ? MESSAGES.unavailable : MESSAGES.editing),
  );
}
