import { Page } from '@playwright/test';

export interface RegisteredThroughApi {
  clientId: string;
  name: string;
  clientSecret: string | null;
}

/**
 * Registers an app through the clients API as the page's signed-in administrator, with a unique name, so a test can
 * act on it in Settings → Apps (journey 21).
 */
export async function registerAppThroughApi(
  page: Page,
  options: { name?: string; confidential?: boolean; offlineAccess?: boolean } = {},
): Promise<RegisteredThroughApi> {
  const name = options.name ?? `Notes ${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  const response = await page.request.post('/api/clients', {
    headers: { 'X-XSRF-TOKEN': xsrf },
    data: {
      name,
      redirectUris: ['https://notes.example.com/signin-oidc'],
      postLogoutRedirectUris: [],
      frontChannelLogoutUri: null,
      scopes: [],
      confidential: options.confidential ?? false,
      offlineAccess: options.offlineAccess ?? false,
    },
  });
  if (!response.ok()) throw new Error(`Registering ${name} failed: ${response.status()}`);
  const body = (await response.json()) as { client: { clientId: string }; clientSecret: string | null };
  return { clientId: body.client.clientId, name, clientSecret: body.clientSecret };
}

/** The seeded sample app's client ID (journey 16). */
export const SAMPLE_APP_CLIENT_ID = 'ingresso-sample-app';

/**
 * Approves these scopes for an app as the page's signed-in person, as Allow on the consent page would, so a test can
 * start from an earlier approval (journey 23).
 */
export async function approveThroughApi(page: Page, clientId: string, scope: string): Promise<void> {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  const response = await page.request.post('/api/consent', {
    headers: { 'X-XSRF-TOKEN': xsrf },
    data: { clientId, scope },
  });
  if (!response.ok()) throw new Error(`Approving ${scope} for ${clientId} failed: ${response.status()}`);
}
