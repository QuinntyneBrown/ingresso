import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Chip } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-chip-scenario',
  imports: [Chip],
  template: `@for (i of items(); track i) {
    <ig-chip label="Work" removable />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ChipScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Chip', component: ChipScenario };
