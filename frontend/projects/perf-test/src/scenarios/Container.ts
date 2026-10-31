import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-container-scenario',
  imports: [Container],
  template: `@for (i of items(); track i) {
    <ig-container><p>Northwind Billing</p></ig-container>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ContainerScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Container', component: ContainerScenario };
