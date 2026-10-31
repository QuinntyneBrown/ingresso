import type { StoryObj } from '@storybook/angular';
import { StatusPage } from '../../../src/lib/status-page/status-page';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<StatusPage> = {
  args: { code: '404', heading: "We can't find that page" },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<ig-status-page [code]="code" [heading]="heading"><p slot="message">The page may have moved, or the link has a typo.</p><ng-container slot="actions"><a ig-button appearance="primary" href="#">Back to your apps</a><a ig-button href="#">Open the app</a></ng-container></ig-status-page>`,
  }),
};
