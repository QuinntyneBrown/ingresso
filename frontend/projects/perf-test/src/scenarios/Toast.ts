import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActiveToast, Toast } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-toast-scenario',
  imports: [Toast],
  template: `@for (i of items(); track i) {
    <ig-toast [toast]="toast" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ToastScenario {
  readonly items = input.required<number[]>();
  protected readonly toast: ActiveToast = {
    id: 1,
    kind: 'success',
    title: 'App added',
    text: 'Northwind Billing is on your dashboard.',
    remainingMs: 8000,
    paused: true,
  };
}

export const scenario: Scenario = { name: 'Toast', component: ToastScenario };
