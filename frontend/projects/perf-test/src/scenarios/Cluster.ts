import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Cluster } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-cluster-scenario',
  imports: [Cluster],
  template: `@for (i of items(); track i) {
    <ig-cluster justify="between"><span>left</span><span>right</span></ig-cluster>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ClusterScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Cluster', component: ClusterScenario };
