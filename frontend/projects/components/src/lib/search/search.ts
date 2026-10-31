import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * A "jump to" search box in a `role="search"` form: a visually hidden label, the search icon, a `type="search"`
 * input and a keyboard hint. Pressing the `shortcut` key (default "/") anywhere outside a text field focuses it;
 * Escape clears it. Emits `searched` on Enter.
 */
@Component({
  selector: 'ig-search',
  imports: [Icon],
  template: `
    <form class="search" role="search" (submit)="$event.preventDefault(); searched.emit(box.value)">
      <label class="visually-hidden" [for]="id">{{ label() }}</label>
      <ig-icon name="search" />
      <input
        #box
        class="search__input"
        type="search"
        autocomplete="off"
        [id]="id"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="value.set(box.value)"
        (keydown.escape)="clear(box)"
        (keydown.arrowdown)="move($event, 1)"
        (keydown.arrowup)="move($event, -1)"
      />
      @if (shortcut() && !value()) {
        <kbd class="search__hint" aria-hidden="true">{{ shortcut() }}</kbd>
      }
    </form>
  `,
  styleUrl: './search.scss',
  host: { '(document:keydown)': 'onDocumentKeydown($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search {
  protected readonly id = `ig-search-${nextId++}`;
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  readonly label = input('Jump to an app');
  readonly placeholder = input('Jump to an app');
  /** The key that focuses the box; empty turns the shortcut off. */
  readonly shortcut = input('/');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  readonly searched = output<string>();
  /** Down (1) or Up (-1) was pressed in the box. */
  readonly navigated = output<1 | -1>();
  private returnTo: HTMLElement | null = null;

  focus(): void {
    this.box().nativeElement.focus();
  }

  protected clear(box: HTMLInputElement): void {
    this.value.set('');
    const back = this.returnTo;
    this.returnTo = null;
    if (back?.isConnected) back.focus();
    else box.blur();
  }

  protected move(event: Event, step: 1 | -1): void {
    event.preventDefault();
    this.navigated.emit(step);
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const key = this.shortcut();
    if (!key || event.key !== key || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented)
      return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    event.preventDefault();
    this.returnTo = target && target !== document.body ? target : null;
    this.focus();
  }
}
