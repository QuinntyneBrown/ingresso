import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const dataDir = resolve(__dirname, '../.data');

export const API_PORT = process.env['PW_API_PORT'] ?? '5100';
export const API_URL = `http://localhost:${API_PORT}`;
export const TODAY = '2026-11-02T14:00:00Z';

/** Environment shared by the CLI and the API: seeded SQLite, fixed clock, test sign-in seam. */
export function apiEnvironment(databaseName = 'e2e'): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Development',
    ASPNETCORE_URLS: API_URL,
    Database__Provider: 'Sqlite',
    ConnectionStrings__Default: `Data Source=${resolve(dataDir, `${databaseName}.db`)}`,
    Clock__FixedUtcNow: TODAY,
    Auth__TestSignIn__Enabled: 'true',
    // Sign-in links point at the web app, whose dev server proxies /auth to the API, and the dev mailbox is readable.
    Site__PublicBaseUrl: `http://localhost:${process.env['PW_WEB_PORT'] ?? '4200'}`,
    DevMailbox__Expose: 'true',
    Outbox__PollInterval: '00:00:00.5',
    DOTNET_CLI_TELEMETRY_OPTOUT: '1',
  };
}

/** Builds the solution, resets and seeds the SQLite database, and starts the API. */
export async function startApi(databaseName = 'e2e'): Promise<ChildProcess> {
  const env = apiEnvironment(databaseName);
  mkdirSync(dataDir, { recursive: true });
  rmSync(resolve(dataDir, `${databaseName}.db`), { force: true });
  execFileSync('dotnet', ['build', 'Ingresso.sln', '-v', 'q', '-nologo'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  execFileSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', 'reset', '--confirm'],
    {
      cwd: repoRoot,
      env,
      stdio: 'inherit',
    },
  );
  const api = spawn(
    'dotnet',
    ['run', '--no-build', '--no-launch-profile', '--project', 'backend/src/Ingresso.Api'],
    {
      cwd: repoRoot,
      env,
      stdio: process.env['E2E_API_LOGS'] ? 'inherit' : 'ignore',
    },
  );
  await waitForApi();
  return api;
}

async function waitForApi(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${API_URL}/api`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`The API did not start on ${API_URL}`);
}
