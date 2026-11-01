// Proxies /api, /health, /auth, /connect and /.well-known to the .NET API. PW_API_PORT changes the API port (default 5100).
const target = `http://localhost:${process.env.PW_API_PORT ?? 5100}`;

module.exports = {
  '/api': { target, secure: false },
  '/health': { target, secure: false },
  // Sign-in links in emails open /auth/redeem on the web origin. The trailing slash keeps the app's own
  // /authorize-error page (journey 16) out of the proxy.
  '/auth/': { target, secure: false },
  // The identity provider (journey 16): authorization and token endpoints, discovery and signing keys.
  '/connect': { target, secure: false },
  '/.well-known': { target, secure: false },
};
