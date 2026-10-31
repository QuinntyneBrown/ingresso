import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Menu, MenuDivider, MenuItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-menu-scenario',
  imports: [Menu, MenuItem, MenuDivider],
  template: `@for (i of items(); track i) {
    <ig-menu aria-label="Account menu">
      <a ig-menu-item href="#settings" shortcut="G S">Settings</a>
      <a ig-menu-item href="#brand">Brand guide</a>
      <ig-menu-divider />
      <button ig-menu-item kind="danger">Sign out</button>
    </ig-menu>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MenuScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Menu', component: MenuScenario };
