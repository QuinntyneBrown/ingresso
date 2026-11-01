/*
 * Public API surface of the ingresso API clients: contracts, injection tokens and implementations.
 * Pages depend on the tokens, never on the concrete clients.
 */
export * from './lib/core/api-config';
export * from './lib/core/api-error';
export * from './lib/core/api-error.interceptor';
export * from './lib/auth/auth-api';
export * from './lib/clients/clients-api';
export * from './lib/profile/profile-api';
export * from './lib/consent/consent-api';
export * from './lib/tiles/tile';
export * from './lib/tiles/tiles-api';
