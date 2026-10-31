import { TileSize } from 'api';

/** A common app people add from the directory. */
export interface CatalogApp {
  name: string;
  url: string;
  description: string;
  color: string;
  initial: string;
  category: string;
  size: TileSize;
}

export const CATALOG: CatalogApp[] = [
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Code, pull requests and issues.',
    color: '#17181C',
    initial: 'GH',
    category: 'Engineering',
    size: 'small',
  },
  {
    name: 'Slack',
    url: 'https://app.slack.com',
    description: 'Team chat and channels.',
    color: '#6D28D9',
    initial: 'S',
    category: 'Communication',
    size: 'small',
  },
  {
    name: 'Linear',
    url: 'https://linear.app',
    description: 'Issues and roadmaps.',
    color: '#2563EB',
    initial: 'L',
    category: 'Engineering',
    size: 'small',
  },
  {
    name: 'Notion',
    url: 'https://www.notion.so',
    description: 'Docs and wikis.',
    color: '#17181C',
    initial: 'N',
    category: 'Docs',
    size: 'small',
  },
  {
    name: 'Figma',
    url: 'https://www.figma.com',
    description: 'Design files and prototypes.',
    color: '#BE185D',
    initial: 'F',
    category: 'Design',
    size: 'small',
  },
  {
    name: 'Google Drive',
    url: 'https://drive.google.com',
    description: 'Files and shared folders.',
    color: '#1B6B3C',
    initial: 'GD',
    category: 'Docs',
    size: 'small',
  },
  {
    name: 'Google Calendar',
    url: 'https://calendar.google.com',
    description: 'Meetings and schedules.',
    color: '#2563EB',
    initial: 'GC',
    category: 'Productivity',
    size: 'small',
  },
  {
    name: 'Zoom',
    url: 'https://zoom.us',
    description: 'Video meetings.',
    color: '#2563EB',
    initial: 'Z',
    category: 'Communication',
    size: 'small',
  },
  {
    name: 'Jira',
    url: 'https://www.atlassian.com/software/jira',
    description: 'Tickets and sprints.',
    color: '#2563EB',
    initial: 'J',
    category: 'Engineering',
    size: 'small',
  },
  {
    name: 'Sentry',
    url: 'https://sentry.io',
    description: 'Errors and performance.',
    color: '#6D28D9',
    initial: 'SE',
    category: 'Engineering',
    size: 'small',
  },
  {
    name: 'Stripe',
    url: 'https://dashboard.stripe.com',
    description: 'Payments and invoices.',
    color: '#6D28D9',
    initial: 'ST',
    category: 'Finance',
    size: 'small',
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    description: 'Deployments and previews.',
    color: '#17181C',
    initial: 'V',
    category: 'Engineering',
    size: 'small',
  },
];
