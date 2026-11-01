import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { API_URL, apiEnvironment } from './api-server';

const repoRoot = resolve(__dirname, '../../..');

/**
 * Runs `ingresso keys rotate` against the suite's database, as the owner would, and waits until the API publishes
 * the new key (it reloads keys every second under Playwright). Returns the new active key's id.
 */
export async function rotateSigningKeys(): Promise<string> {
  const result = spawnSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', 'keys', 'rotate'],
    { cwd: repoRoot, env: apiEnvironment(), encoding: 'utf8' },
  );
  const active = /Active key: (\w+)/.exec(result.stdout)?.[1];
  if (result.status !== 0 || !active) throw new Error(`keys rotate failed: ${result.stdout}${result.stderr}`);
  for (let attempt = 0; attempt < 40; attempt++) {
    const jwks = (await (await fetch(`${API_URL}/.well-known/jwks`)).json()) as { keys: { kid: string }[] };
    if (jwks.keys.some((k) => k.kid === active)) return active;
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`The API never published the new signing key ${active}.`);
}
