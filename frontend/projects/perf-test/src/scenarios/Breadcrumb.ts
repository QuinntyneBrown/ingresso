import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Breadcrumb, BreadcrumbItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-breadcrumb-scenario',
  imports: [Breadcrumb],
  template: `@for (i of items(); track i) {
    <ig-breadcrumb [items]="trail" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BreadcrumbScenario {
  readonly items = input.required<number[]>();
  protected readonly trail: BreadcrumbItem[] = [
    { label: 'Apps', href: '#' },
    { label: 'Directory', href: '#' },
    { label: 'Asana' },
  ];
}

export const scenario: Scenario = { name: 'Breadcrumb', component: BreadcrumbScenario };
