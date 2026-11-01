import { startApi, startSampleApp } from './api-server';

/**
 * Starts the API on a freshly seeded SQLite database, and the sample relying party, for the whole run, and stops
 * them afterwards.
 */
export default async function globalSetup() {
  const api = await startApi();
  const sampleApp = await startSampleApp();
  return async () => {
    sampleApp.kill();
    api.kill();
  };
}
