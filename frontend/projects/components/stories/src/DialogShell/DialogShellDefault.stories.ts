import type { StoryObj } from '@storybook/angular';
import { DialogShell } from '../../../src/lib/dialog-shell/dialog-shell';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<DialogShell> = {
  args: { title: 'Add an app', variant: 'modal' },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<div style="max-width: 32rem"><ig-dialog-shell [title]="title" [variant]="variant"><p>Choose where to add Azure Data &amp; AI Day GTA.</p><button slot="footer" ig-button type="button">Cancel</button><button slot="footer" ig-button type="button" appearance="primary">Add</button></ig-dialog-shell></div>`,
  }),
};
