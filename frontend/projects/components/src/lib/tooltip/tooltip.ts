import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TooltipPlacement = 'above' | 'below';

/**
 * A short label that appears above an icon-only control on hover or focus. Put it inside the control and give the
 * control the class `has-tooltip`; the control keeps its own `aria-label`, so the tooltip is a visual aid only.
 */
@Component({
  selector: 'ig-tooltip',
  template: '<ng-content />',
  styles: `
    :host {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      translate: -50% 0;
      z-index: var(--ig-z-tooltip);
      padding: var(--spacingVerticalXS) var(--spacingHorizontalS);
      background: var(--colorNeutralBackgroundInverted);
      color: var(--colorNeutralForegroundInverted);
      border-radius: var(--borderRadiusMedium);
      font: var(--ig-text-caption);
      white-space: nowrap;
      pointer-events: none;
      box-shadow: var(--shadow4);
      opacity: 0;
      transition: opacity var(--durationFaster) var(--curveEasyEase);
    }
    :host([data-placement='below']) {
      bottom: auto;
      top: calc(100% + 8px);
    }
    :host::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      translate: -50% 0;
      border: 5px solid transparent;
      border-top-color: var(--colorNeutralBackgroundInverted);
    }
    :host([data-placement='below'])::after {
      top: auto;
      bottom: 100%;
      border-top-color: transparent;
      border-bottom-color: var(--colorNeutralBackgroundInverted);
    }
    :host-context(.has-tooltip:hover),
    :host-context(.has-tooltip:focus-visible),
    :host-context(.has-tooltip:focus-within) {
      opacity: 1;
    }
  `,
  host: { role: 'tooltip', '[attr.data-placement]': 'placement()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {
  /** Where the tooltip opens; use `below` for controls at the top of the viewport. */
  readonly placement = input<TooltipPlacement>('above');
}
