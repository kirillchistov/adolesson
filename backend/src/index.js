import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 5001);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildApp({
  logger: {
    level: 'info',
    redact: ['req.body', 'req.headers.cookie', 'req.headers.authorization'],
  },
});

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
