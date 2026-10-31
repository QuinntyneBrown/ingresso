import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The page footer: a one-line note and, to its right, links (`[slot=links]`). */
@Component({
  selector: 'ig-site-footer',
  template: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <p class="site-footer__note">{{ note() }}</p>
        <nav class="site-footer__links" aria-label="Footer"><ng-content select="[slot=links]" /></nav>
      </div>
    </footer>
  `,
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  readonly note = input.required<string>();
}
