import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AppIcon } from '../app-icon/app-icon';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * One app on the dashboard. `large` tiles show the icon, name, address and an "Opened … / Open" footer; `small`
 * tiles show the icon, name and address. The whole tile is a link that opens the app in a new tab (`opened` fires
 * first). In `editing` mode the tile is not a link: it shows a drag handle and an Edit button (`edit`).
 */
@Component({
  selector: 'ig-app-tile',
  template: `
    <ng-template #body>
      <div class="tile__head">
        <ig-app-icon [initial]="initial()" [color]="color()" [size]="size() === 'large' ? 'lg' : 'md'" />
        <div class="tile__text">
          <span class="tile__name">{{ name() }}</span>
          <span class="tile__url">{{ displayUrl() }}</span>
        </div>
      </div>
      @if (size() === 'large') {
        @if (description()) {
          <p class="tile__description">{{ description() }}</p>
        }
        <div class="tile__foot">
          <span class="tile__opened">{{ openedLabel() }}</span>
          <span class="tile__open">Open <ig-icon name="external" size="sm" /></span>
        </div>
      }
    </ng-template>

    <article class="tile" [class]="'tile tile--' + size()" [class.tile--editing]="editing()">
      @if (editing()) {
        <div class="tile__surface">
          <span class="tile__handle" aria-hidden="true"><ig-icon name="grip" /></span>
          <ng-container *ngTemplateOutlet="body" />
        </div>
        <button
          ig-button
          type="button"
          appearance="ghost"
          size="sm"
          iconOnly
          class="tile__edit"
          [attr.aria-label]="'Edit ' + name()"
          (click)="edit.emit()"
        >
          <ig-icon name="edit" />
        </button>
      } @else {
        <a
          class="tile__surface"
          [href]="url()"
          target="_blank"
          rel="noopener noreferrer"
          (click)="opened.emit()"
        >
          <ng-container *ngTemplateOutlet="body" />
        </a>
      }
    </article>
  `,
  imports: [AppIcon, Button, Icon, NgTemplateOutlet],
  styleUrl: './app-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTile {
  readonly name = input.required<string>();
  readonly url = input.required<string>();
  readonly initial = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<'large' | 'small'>('small');
  readonly description = input<string | null>(null);
  /** The footer text of a large tile, such as "Opened 8 minutes ago". */
  readonly openedLabel = input('Not opened yet');
  readonly editing = input(false, { transform: booleanAttribute });

  readonly opened = output<void>();
  readonly edit = output<void>();

  protected readonly displayUrl = computed(() =>
    this.url()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, ''),
  );
}
