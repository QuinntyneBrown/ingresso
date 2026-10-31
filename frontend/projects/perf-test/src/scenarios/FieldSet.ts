import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldSet } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-field-set-scenario',
  imports: [FieldSet],
  template: `@for (i of items(); track i) {
    <ig-field-set legend="Category" [controlId]="'t' + i"></ig-field-set>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FieldSetScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FieldSet', component: FieldSetScenario };
