import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from './shell/app-shell';

@Component({
  selector: 'ig-root',
  imports: [AppShell],
  template: `<ig-app-shell />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
