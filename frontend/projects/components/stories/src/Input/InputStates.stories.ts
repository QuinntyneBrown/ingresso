import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const States: StoryObj<Input> = {
  render: () => ({
    template: `<div class="stack"><input ig-input aria-label="Invalid" aria-invalid="true" value="http://example.com" /><input ig-input aria-label="Disabled" disabled value="0.00" /><textarea ig-input aria-label="Notes (read-only)" readonly rows="3">Added from the shared workspace.</textarea><select ig-input aria-label="Sort by (disabled)" disabled><option>Recently opened</option></select></div>`,
  }),
};
