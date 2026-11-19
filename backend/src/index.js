import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 5001);
const host = process.env.HOST ?? '0.0.0.0';
const corsOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const app = await buildApp({
  logger: {
    level: 'info',
    redact: ['req.body', 'req.headers.cookie', 'req.headers.authorization'],
  },
  corsOrigins,
  cookieSecure: process.env.COOKIE_SECURE === '1',
});

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
