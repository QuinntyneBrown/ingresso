import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormSection } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-form-section-scenario',
  imports: [FormSection],
  template: `@for (i of items(); track i) {
    <ig-form-section title="When" [sectionId]="'s' + i"></ig-form-section>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormSectionScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FormSection', component: FormSectionScenario };
