import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DialogShell } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-dialog-shell-scenario',
  imports: [DialogShell],
  template: `@for (i of items(); track i) {
    <ig-dialog-shell title="Menu"><p>Body</p></ig-dialog-shell>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogShellScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'DialogShell', component: DialogShellScenario };
