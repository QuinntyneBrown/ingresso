/** A common app people add from the directory. */
export interface CatalogApp {
  name: string;
  url: string;
  description: string;
  color: string;
  initial: string;
  category: string;
}

export const CATALOG: CatalogApp[] = [
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Code, pull requests and issues.',
    color: '#17181C',
    initial: 'GH',
    category: 'Engineering',
  },
  {
    name: 'Slack',
    url: 'https://app.slack.com',
    description: 'Team chat and channels.',
    color: '#6D28D9',
    initial: 'S',
    category: 'Communication',
  },
  {
    name: 'Linear',
    url: 'https://linear.app',
    description: 'Issues and roadmaps.',
    color: '#2563EB',
    initial: 'L',
    category: 'Engineering',
  },
  {
    name: 'Notion',
    url: 'https://www.notion.so',
    description: 'Docs and wikis.',
    color: '#17181C',
    initial: 'N',
    category: 'Docs',
  },
  {
    name: 'Figma',
    url: 'https://www.figma.com',
    description: 'Design files and prototypes.',
    color: '#BE185D',
    initial: 'F',
    category: 'Design',
  },
  {
    name: 'Google Drive',
    url: 'https://drive.google.com',
    description: 'Files and shared folders.',
    color: '#1B6B3C',
    initial: 'GD',
    category: 'Docs',
  },
  {
    name: 'Google Calendar',
    url: 'https://calendar.google.com',
    description: 'Meetings and schedules.',
    color: '#2563EB',
    initial: 'GC',
    category: 'Productivity',
  },
  {
    name: 'Zoom',
    url: 'https://zoom.us',
    description: 'Video meetings.',
    color: '#2563EB',
    initial: 'Z',
    category: 'Communication',
  },
  {
    name: 'Jira',
    url: 'https://www.atlassian.com/software/jira',
    description: 'Tickets and sprints.',
    color: '#2563EB',
    initial: 'J',
    category: 'Engineering',
  },
  {
    name: 'Sentry',
    url: 'https://sentry.io',
    description: 'Errors and performance.',
    color: '#6D28D9',
    initial: 'SE',
    category: 'Engineering',
  },
  {
    name: 'Stripe',
    url: 'https://dashboard.stripe.com',
    description: 'Payments and invoices.',
    color: '#6D28D9',
    initial: 'ST',
    category: 'Finance',
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    description: 'Deployments and previews.',
    color: '#17181C',
    initial: 'V',
    category: 'Engineering',
  },
];
