import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** One crumb: a page title with an app route (`link`) or an address (`href`). The last crumb is the current page. */
export interface BreadcrumbItem {
  label: string;
  link?: string;
  href?: string;
}

/**
 * Shows where the page sits in a hierarchy: a `nav` landmark with an ordered list of ancestor links and the
 * current page as plain text (`aria-current="page"`). ingresso is mostly flat, so most pages use a back link;
 * use a breadcrumb only for two or more levels.
 */
@Component({
  selector: 'ig-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav [attr.aria-label]="label()">
      <ol class="breadcrumb">
        @for (item of ancestors(); track $index) {
          <li>
            @if (item.link) {
              <a [routerLink]="item.link">{{ item.label }}</a>
            } @else {
              <a [href]="item.href ?? '#'">{{ item.label }}</a>
            }
          </li>
        }
        @if (current(); as page) {
          <li aria-current="page">{{ page.label }}</li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  /** The trail from the top level to the current page, in order. */
  readonly items = input.required<BreadcrumbItem[]>();
  /** The landmark's accessible name. */
  readonly label = input('Breadcrumb');

  protected readonly ancestors = computed(() => this.items().slice(0, -1));
  protected readonly current = computed(() => this.items().at(-1));
}
