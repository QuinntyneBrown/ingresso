/** Starts the API (seeded SQLite) and `ng serve` and keeps them running until Ctrl+C: npm run e2e:serve */
import { spawn } from 'node:child_process';
import { API_URL, startApi } from './api-server';

const webPort = process.env['PW_WEB_PORT'] ?? '4200';

async function main() {
  const api = await startApi('serve');
  const web = spawn('npx', ['ng', 'serve', 'ingresso', '--port', webPort, '--host', '0.0.0.0'], {
    stdio: 'inherit',
  });
  const stop = () => {
    api.kill();
    web.kill();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  console.log(`API on ${API_URL}, app on http://localhost:${webPort}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
