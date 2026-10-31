import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * A pill for a filter or a removable value. By default a filter toggle (`aria-pressed`, two-way `pressed`);
 * `removable` renders the value with a labelled "Remove {label}" button that emits `removed`.
 */
@Component({
  selector: 'ig-chip',
  imports: [Icon],
  template: `@if (removable()) {
      <span class="chip"
        >{{ label()
        }}<button
          class="remove"
          type="button"
          [attr.aria-label]="'Remove ' + label()"
          (click)="removed.emit()"
        >
          <ig-icon name="x" size="sm" /></button
      ></span>
    } @else {
      <button class="chip" type="button" [attr.aria-pressed]="pressed()" (click)="toggle()">
        {{ label() }}
      </button>
    }`,
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chip {
  readonly label = input.required<string>();
  readonly pressed = model(false);
  readonly removable = input(false, { transform: booleanAttribute });

  readonly removed = output<void>();

  protected toggle(): void {
    this.pressed.update((pressed) => !pressed);
  }
}
