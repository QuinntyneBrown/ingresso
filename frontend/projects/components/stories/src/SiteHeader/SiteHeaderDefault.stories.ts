import type { StoryObj } from '@storybook/angular';
import { SiteHeader } from '../../../src/lib/site-header/site-header';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';
import { Logo } from '../../../src/lib/logo/logo';
import { Search } from '../../../src/lib/search/search';
import { Avatar } from '../../../src/lib/avatar/avatar';

export const Default: StoryObj<SiteHeader> = {
  render: () => ({
    moduleMetadata: { imports: [Button, Icon, Logo, Search, Avatar] },
    template: `<ig-site-header><ig-logo slot="brand" /><ig-search slot="search" /><ng-container slot="actions"><button ig-button type="button">Edit layout</button><button ig-button type="button" appearance="primary"><ig-icon name="plus" />Add app</button><ig-avatar initials="MO" /></ng-container></ig-site-header>`,
  }),
};
