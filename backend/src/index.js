import { buildApp } from './app.js';
import { runtimeOptions } from './runtime.js';

const port = Number(process.env.PORT ?? 5001);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildApp(runtimeOptions());

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
