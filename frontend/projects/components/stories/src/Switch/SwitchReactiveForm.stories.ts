import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';

export const ReactiveForm: StoryObj<Switch> = {
  render: () => {
    const newTab = new FormControl(true, { nonNullable: true });
    return {
      moduleMetadata: { imports: [ReactiveFormsModule] },
      props: { newTab },
      template: `<div class="stack stack--sm">
        <ig-switch [formControl]="newTab">Open apps in a new tab</ig-switch>
        <p>Form value: <code>{{ newTab.value }}</code></p>
      </div>`,
    };
  },
};
