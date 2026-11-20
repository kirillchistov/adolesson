import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePgConfig } from '../src/pg-config.js';

test('локальная строка остаётся как есть', () => {
  const resolved = resolvePgConfig('postgres://adolesson:adolesson@localhost:5432/adolesson', {});
  const url = new URL(resolved.pool.connectionString);
  assert.equal(url.hostname, 'localhost');
  assert.equal(url.port, '5432');
  assert.equal(resolved.schema, '');
  assert.equal(resolved.pool.ssl, undefined);
  assert.equal(resolved.pool.max, undefined);
});

test('прямой хост Supabase становится session pooler', () => {
  const resolved = resolvePgConfig(
    'postgresql://postgres:secret@db.abcdefghijklmnopqrst.supabase.co:5432/postgres?sslmode=require',
    { SUPABASE_REGION: 'eu-west-3' },
  );
  const url = new URL(resolved.pool.connectionString);
  assert.equal(url.hostname, 'aws-0-eu-west-3.pooler.supabase.com');
  assert.equal(url.port, '5432');
  assert.equal(decodeURIComponent(url.username), 'postgres.abcdefghijklmnopqrst');
  assert.equal(url.password, 'secret');
  assert.equal(url.searchParams.get('sslmode'), null);
  assert.equal(resolved.schema, 'adolesson');
  assert.equal(resolved.pool.max, 1);
  assert.deepEqual(resolved.pool.ssl, { rejectUnauthorized: false });
  assert.equal(resolved.pool.options, '-c search_path=adolesson');
});

test('transaction pooler переключается на session pooler', () => {
  const resolved = resolvePgConfig(
    'postgresql://postgres.abcdefghijklmnopqrst:secret@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true',
    {},
  );
  const url = new URL(resolved.pool.connectionString);
  assert.equal(url.port, '5432');
  assert.equal(url.hostname, 'aws-0-eu-west-3.pooler.supabase.com');
  assert.equal(url.searchParams.get('pgbouncer'), null);
  assert.equal(resolved.pool.max, 1);
});

test('готовая session-строка сохраняет порт 5432', () => {
  const raw = 'postgresql://postgres.abcdefghijklmnopqrst:secret@aws-0-eu-west-3.pooler.supabase.com:5432/postgres';
  const resolved = resolvePgConfig(raw, {});
  assert.equal(new URL(resolved.pool.connectionString).port, '5432');
});

test('чужое имя схемы отклоняется', () => {
  assert.throws(
    () => resolvePgConfig('postgres://adolesson:adolesson@localhost:5432/adolesson', { DB_SCHEMA: 'Public;drop' }),
    /DB_SCHEMA/,
  );
});
