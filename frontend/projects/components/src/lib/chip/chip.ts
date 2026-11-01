import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * A pill for a filter or a removable value. By default a filter toggle (`aria-pressed`, two-way `pressed`);
 * `choice` makes it one of a single-choice row, which a click only presses (the parent unpresses the others);
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
  /** One of a single-choice row: choosing it again keeps it chosen. */
  readonly choice = input(false, { transform: booleanAttribute });

  readonly removed = output<void>();

  protected toggle(): void {
    if (this.choice()) {
      if (!this.pressed()) this.pressed.set(true);
      return;
    }
    this.pressed.update((pressed) => !pressed);
  }
}
