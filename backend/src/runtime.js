export function runtimeOptions() {
  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    logger: {
      level: 'info',
      redact: ['req.body', 'req.headers.cookie', 'req.headers.authorization'],
    },
    corsOrigins,
    cookieSecure: process.env.COOKIE_SECURE === '1',
  };
}
