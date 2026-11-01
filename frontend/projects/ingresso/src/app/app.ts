import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './state/theme-store';

@Component({
  selector: 'ig-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Creating the store applies the saved theme before the first screen shows, signed in or not.
  constructor() {
    inject(ThemeStore);
  }
}
