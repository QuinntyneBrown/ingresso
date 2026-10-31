import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, Input } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-form-field-scenario',
  imports: [FormField, Input],
  template: `@for (i of items(); track i) {
    <ig-form-field label="App name" [controlId]="'f' + i" hint="Up to 90 characters."
      ><input ig-input [id]="'f' + i"
    /></ig-form-field>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormFieldScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FormField', component: FormFieldScenario };
