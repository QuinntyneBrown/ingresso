import { afterNextRender, ElementRef, Injector } from '@angular/core';

/** After the next render, scrolls the first alert in `host` into view, so a message above a scrolled dialog body is seen. */
export function revealAlert(host: ElementRef<HTMLElement>, injector: Injector): void {
  afterNextRender(() => host.nativeElement.querySelector('ig-alert')?.scrollIntoView({ block: 'nearest' }), {
    injector,
  });
}
