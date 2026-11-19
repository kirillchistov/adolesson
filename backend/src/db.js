import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');

function migrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

async function applyMigrations(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  for (const file of migrationFiles()) {
    const id = file.replace(/\.sql$/, '');
    const existing = await db.query('SELECT id FROM schema_migrations WHERE id = $1', [id]);
    if (existing.rows.length > 0) continue;
    await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    await db.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
  }
}

function wrapQuery(run) {
  return async (sql, params = []) => {
    const result = await run(sql, params);
    return { rows: result.rows };
  };
}

async function openPglite() {
  const { PGlite } = await import('@electric-sql/pglite');
  const client = new PGlite();
  const query = wrapQuery((sql, params) => client.query(sql, params));
  const db = {
    query,
    exec: (sql) => client.exec(sql),
    transaction: async (fn) => {
      await client.query('BEGIN');
      try {
        const result = await fn(query);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    close: () => client.close(),
  };
  await applyMigrations(db);
  return db;
}

async function openPostgres(connectionString) {
  const pool = new pg.Pool({ connectionString });
  const query = wrapQuery((sql, params) => pool.query(sql, params));
  const db = {
    query,
    exec: (sql) => pool.query(sql),
    transaction: async (fn) => {
      const client = await pool.connect();
      const clientQuery = wrapQuery((sql, params) => client.query(sql, params));
      try {
        await client.query('BEGIN');
        const result = await fn(clientQuery);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
  await applyMigrations(db);
  return db;
}

/**
 * `pglite` — PostgreSQL в процессе, для тестов.
 * Иначе строка подключения DATABASE_URL.
 */
export async function openDatabase(source = process.env.DATABASE_URL) {
  if (source === 'pglite') return openPglite();
  if (!source) {
    throw new Error(
      'Задайте DATABASE_URL. Локально: postgres://adolesson:adolesson@localhost:5432/adolesson',
    );
  }
  return openPostgres(source);
}
