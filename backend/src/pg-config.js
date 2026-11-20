const SCHEMA_NAME = /^[a-z_][a-z0-9_]{0,30}$/;
const REGION_NAME = /^[a-z0-9-]{1,40}$/;
const DIRECT_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/i;

/**
 * Строка подключения для node-pg.
 * Общий проект Supabase: схема adolesson, session pooler (порт 5432).
 * Порт 6543 — transaction pooler: он не держит транзакцию и подготовленный запрос.
 * Прямой хост db.*.supabase.co с Vercel часто недоступен, его заменяет pooler.
 * sslmode в URL не оставляем: текущий pg читает require как проверку сертификата
 * и обрывает соединение с Supabase.
 */
export function resolvePgConfig(rawUrl, env = process.env) {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  const supabase = host.includes('pooler.supabase')
    || host.endsWith('.supabase.co')
    || host.endsWith('.supabase.com');
  const schema = schemaName(env.DB_SCHEMA, supabase);

  url.searchParams.delete('sslmode');
  url.searchParams.delete('pgbouncer');

  const direct = host.match(DIRECT_HOST);
  if (direct) {
    const region = regionName(env.SUPABASE_REGION);
    url.hostname = `aws-0-${region}.pooler.supabase.com`;
    url.port = '5432';
    if (!decodeURIComponent(url.username).includes('.')) {
      url.username = `${decodeURIComponent(url.username)}.${direct[1]}`;
    }
  } else if (host.includes('pooler.supabase') && url.port === '6543') {
    url.port = '5432';
  }

  const pool = {
    connectionString: url.toString(),
  };
  if (supabase) {
    pool.max = 1;
    pool.idleTimeoutMillis = 5000;
    pool.ssl = { rejectUnauthorized: false };
  }
  if (schema) pool.options = `-c search_path=${schema}`;

  return { pool, schema, supabase };
}

function schemaName(explicit, supabase) {
  const schema = (explicit ?? '').trim() || (supabase ? 'adolesson' : '');
  if (schema && !SCHEMA_NAME.test(schema)) {
    throw new Error('DB_SCHEMA: латиница в нижнем регистре, цифры и подчёркивание, до 31 символа');
  }
  return schema;
}

function regionName(explicit) {
  const region = (explicit ?? '').trim() || 'eu-west-3';
  if (!REGION_NAME.test(region)) {
    throw new Error('SUPABASE_REGION: латиница, цифры и дефис');
  }
  return region;
}
