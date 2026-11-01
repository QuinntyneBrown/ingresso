import { spawnSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { apiEnvironment } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

/** Runs the real CLI against the demo database and returns what it printed, as typed at a prompt. */
function cli(...args: string[]): string {
  const result = spawnSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', ...args],
    {
      cwd: REPO,
      env: apiEnvironment('demo'),
      encoding: 'utf8',
    },
  );
  const typed = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  return `$ ingresso ${typed}\n${result.stdout}`;
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Shows terminal output in a terminal window on a 1280 × 720 canvas. */
async function terminal(page: Page, title: string, transcript: string): Promise<void> {
  await page.setContent(`<!doctype html>
<body style="margin:0;height:720px;display:grid;place-items:center;background:#eef1f6;font-family:system-ui,sans-serif">
  <div style="width:1120px;border-radius:12px;overflow:hidden;box-shadow:0 20px 48px rgb(0 0 0 / .25);background:#14171f">
    <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:#232733;color:#c9d1e0;font-size:14px">
      <span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span>
      <span style="margin-left:12px">${escape(title)}</span>
    </div>
    <pre style="margin:0;padding:24px 28px;min-height:360px;color:#e6edf7;font:20px/1.6 'SF Mono',Menlo,monospace;white-space:pre-wrap">${escape(transcript)}</pre>
  </div>
</body>`);
}

/** Register an app for sign-in: add a client, list it, and see an unsafe address refused. */
const journey: Journey = async ({ page, shot }) => {
  await terminal(
    page,
    'ingresso CLI — register an app',
    cli(
      'clients',
      'add',
      '--name',
      'Sample app',
      '--redirect-uri',
      'https://localhost:5201/signin-oidc',
      '--post-logout-redirect-uri',
      'https://localhost:5201/signout-callback-oidc',
    ),
  );
  await shot('register-the-sample-app');

  await terminal(page, 'ingresso CLI — registered apps', cli('clients', 'list'));
  await shot('list-registered-apps');

  await terminal(
    page,
    'ingresso CLI — an unsafe address',
    cli('clients', 'add', '--name', 'Notes', '--redirect-uri', 'http://notes.example.com/callback'),
  );
  await shot('unsafe-address-refused');
};

export default journey;
