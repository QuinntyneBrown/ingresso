// Proxies /api and /health to the .NET API. PW_API_PORT changes the API port (default 5100).
const target = `http://localhost:${process.env.PW_API_PORT ?? 5100}`;

module.exports = {
  '/api': { target, secure: false },
  '/health': { target, secure: false },
};
