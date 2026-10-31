import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The box of a checkbox or radio (`<input type="checkbox" ig-check>`), drawn to the ingresso style. */
@Component({
  selector: 'input[type=checkbox][ig-check], input[type=radio][ig-check]',
  template: '',
  styleUrl: './check.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Check {}

/**
 * A label around one checkbox or radio and its text (`<label ig-choice><input ig-check …>AI</label>`); `card`
 * draws the format cards; `hint` adds a second line.
 */
@Component({
  selector: 'label[ig-choice]',
  template: `<ng-content select="[ig-check]" /><span class="choice__text"
      ><ng-content />
      @if (hint()) {
        <small>{{ hint() }}</small>
      }
    </span>`,
  styleUrl: './choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.choice-card]': 'card()' },
})
export class Choice {
  readonly hint = input<string | null>(null);
  readonly card = input(false, { transform: booleanAttribute });
}
