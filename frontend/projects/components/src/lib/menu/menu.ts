import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export type MenuItemKind = 'default' | 'danger';

/**
 * Opens an `ig-menu` from a button (`<button ig-button [igMenuTriggerFor]="account">`), using CDK Menu: it sets
 * `aria-haspopup="menu"` and `aria-expanded`, opens on Enter, Space or ↓, and returns focus to the trigger on Escape.
 * `igMenuTriggerFor` takes an `<ng-template>` that holds the `ig-menu`.
 */
@Directive({
  selector: '[igMenuTriggerFor]',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: [
        'cdkMenuTriggerFor: igMenuTriggerFor',
        'cdkMenuPosition: igMenuPosition',
        'cdkMenuTriggerData: igMenuTriggerData',
      ],
      outputs: ['cdkMenuOpened: igMenuOpened', 'cdkMenuClosed: igMenuClosed'],
    },
  ],
})
export class MenuTrigger {}

/**
 * A dropdown of actions (`role="menu"`), opened by `igMenuTriggerFor`. CDK Menu supplies the overlay, roving focus,
 * ↑/↓, Home/End, typeahead and Escape. Holds `ig-menu-item`s and `ig-menu-divider`s; put destructive items last.
 */
@Component({
  selector: 'ig-menu',
  template: '<ng-content />',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CdkMenu, outputs: ['closed'] }],
  host: { class: 'menu' },
})
export class Menu {}

/**
 * One action in an `ig-menu` (`<button ig-menu-item>Settings</button>` or `<a ig-menu-item href="…">`). `kind="danger"`
 * marks a destructive action; `shortcut` shows a key hint; `disabled` sets `aria-disabled` and keeps it focusable.
 * `triggered` fires when it is chosen; the menu then closes.
 */
@Component({
  selector: 'button[ig-menu-item], a[ig-menu-item]',
  template: `<ng-content />
    @if (shortcut()) {
      <kbd class="menu__shortcut">{{ shortcut() }}</kbd>
    }`,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuitemTypeaheadLabel: typeaheadLabel'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: { '[class]': 'classes()', '[attr.type]': "isButton ? 'button' : null" },
})
export class MenuItem {
  readonly kind = input<MenuItemKind>('default');
  readonly shortcut = input<string | null>(null);

  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  protected readonly classes = computed(() =>
    this.kind() === 'danger' ? 'menu__item menu__item--danger' : 'menu__item',
  );
}

/** A separator between groups of menu items, such as before the destructive item. */
@Component({
  selector: 'ig-menu-divider',
  template: '',
  styles: `
    :host {
      display: block;
      border-top: 1px solid var(--colorNeutralStroke2);
      margin: var(--spacingVerticalXS) 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'menu__divider', role: 'separator' },
})
export class MenuDivider {}
