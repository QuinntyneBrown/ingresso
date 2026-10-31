import { FocusableOption, FocusKeyManager } from '@angular/cdk/a11y';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { Badge } from '../badge/badge';

let nextId = 0;

/**
 * One tab in an `ig-tabs` tab list (`button.tab[role=tab]`). `ig-tabs` renders these from its `ig-tab-panel`s; only
 * the selected tab is in the tab order.
 */
@Component({
  selector: 'button[ig-tab]',
  imports: [Badge],
  template: `<ng-content />
    @if (count() !== null) {
      <ig-badge class="tab__count">{{ count() }}</ig-badge>
    }`,
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tab',
    role: 'tab',
    type: 'button',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[tabindex]': 'selected() ? 0 : -1',
  },
})
export class Tab implements FocusableOption {
  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef);

  readonly selected = input(false, { transform: booleanAttribute });
  /** Named apart from `FocusableOption.disabled`, which must be a plain boolean. */
  readonly isDisabled = input(false, { transform: booleanAttribute });
  readonly count = input<number | null>(null);

  focus(): void {
    this.host.nativeElement.focus();
  }

  getLabel(): string {
    return this.host.nativeElement.textContent?.trim() ?? '';
  }
}

/**
 * The content of one tab (`<ig-tab-panel label="Recent">…</ig-tab-panel>`), shown while its tab is selected. It is
 * the `role="tabpanel"` element, labelled by its tab. `count` adds a badge to the tab; `disabled` greys the tab out.
 */
@Component({
  selector: 'ig-tab-panel',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      padding-block: var(--spacingVerticalL);
    }
    :host([hidden]) {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
    '[hidden]': '!active()',
  },
})
export class TabPanel {
  private readonly tabs = inject(Tabs);

  readonly label = input.required<string>();
  readonly count = input<number | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly index = computed(() => this.tabs.panels().indexOf(this));
  protected readonly panelId = computed(() => this.tabs.panelId(this.index()));
  protected readonly tabId = computed(() => this.tabs.tabId(this.index()));
  protected readonly active = computed(() => this.index() === this.tabs.selectedIndex());
}

/**
 * Switches between two to five peer views of one page (WAI-ARIA Tabs, automatic activation): ← and → move and select,
 * Home and End jump to the first and last tab, Tab moves into the panel. Give it a `label` for the tab list.
 * `selectedIndex` is two-way bindable.
 */
@Component({
  selector: 'ig-tabs',
  imports: [Tab],
  template: `<div class="tabs" role="tablist" [attr.aria-label]="label()">
      @for (panel of panels(); track panel; let i = $index) {
        <button
          ig-tab
          [id]="tabId(i)"
          [attr.aria-controls]="panelId(i)"
          [selected]="i === selectedIndex()"
          [isDisabled]="panel.disabled()"
          [count]="panel.count()"
          (click)="select(i)"
          (keydown)="onKeydown($event)"
        >
          {{ panel.label() }}
        </button>
      }
    </div>
    <ng-content />`,
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tabs {
  private readonly id = `ig-tabs-${nextId++}`;

  /** The accessible name of the tab list, such as "Apps". */
  readonly label = input.required<string>();
  readonly selectedIndex = model(0);

  readonly panels = contentChildren(TabPanel);
  private readonly tabs = viewChildren(Tab);

  private readonly keyManager = new FocusKeyManager(this.tabs, inject(Injector))
    .withHorizontalOrientation('ltr')
    .withHomeAndEnd()
    .withWrap()
    .skipPredicate((tab) => tab.isDisabled());

  tabId(index: number): string {
    return `${this.id}-tab-${index}`;
  }

  panelId(index: number): string {
    return `${this.id}-panel-${index}`;
  }

  protected select(index: number): void {
    if (this.panels()[index]?.disabled()) return;
    this.selectedIndex.set(index);
    this.keyManager.updateActiveItem(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    this.keyManager.updateActiveItem(this.selectedIndex());
    this.keyManager.onKeydown(event);
    const index = this.keyManager.activeItemIndex;
    if (index !== null && index >= 0) this.select(index);
  }
}
