import { Pool } from 'pg';
import { DATABASE_URL } from './config.js';

function buildPoolConfig() {
  if (DATABASE_URL) {
    return {
      connectionString: DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kalako_db',
    max: 10,
    idleTimeoutMillis: 30000,
  };
}

const rawPool = new Pool(buildPoolConfig());

function wrapResult(result) {
  return {
    rows: result.rows ?? [],
    rowCount: result.rowCount ?? 0,
    insertId: result.rows?.[0]?.id ?? null,
  };
}

async function runQuery(text, params = []) {
  const start = Date.now();
  const result = await rawPool.query(text, params);
  const duration = Date.now() - start;
  const wrapped = wrapResult(result);
  console.log('query', { durationMs: duration, rows: wrapped.rowCount });
  return wrapped;
}

async function getConnection() {
  const client = await rawPool.connect();

  return {
    query: (text, params = []) => client.query(text, params).then(wrapResult),
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release(),
  };
}

export const pool = {
  query: runQuery,
  connect: getConnection,
  end: () => rawPool.end(),
};

export async function query(text, params) {
  return runQuery(text, params);
}

export async function withTransaction(callback) {
  const client = await getConnection();
  try {
    await client.beginTransaction();
    const result = await callback(client);
    await client.commit();
    return result;
  } catch (err) {
    await client.rollback();
    throw err;
  } finally {
    client.release();
  }
}
