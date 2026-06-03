import mysql from 'mysql2/promise';
import { DATABASE_URL } from './config.js';

function buildPoolConfig() {
  if (DATABASE_URL) {
    const url = new URL(DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kalako_db',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
  };
}

const rawPool = mysql.createPool(buildPoolConfig());

function normalizeSql(text) {
  return String(text).replace(/\$(\d+)/g, '?');
}

function wrapResult(result) {
  if (Array.isArray(result)) {
    return {
      rows: result,
      rowCount: result.length,
    };
  }

  return {
    rows: [],
    rowCount: result?.affectedRows ?? 0,
    affectedRows: result?.affectedRows ?? 0,
    insertId: result?.insertId ?? null,
  };
}

async function runQuery(text, params = []) {
  const start = Date.now();
  const [rows] = await rawPool.query(normalizeSql(text), params);
  const duration = Date.now() - start;
  const wrapped = wrapResult(rows);
  console.log('query', { durationMs: duration, rows: wrapped.rowCount });
  return wrapped;
}

async function getConnection() {
  const connection = await rawPool.getConnection();

  return {
    query: (text, params = []) =>
      connection.query(normalizeSql(text), params).then(([rows]) => wrapResult(rows)),
    beginTransaction: () => connection.beginTransaction(),
    commit: () => connection.commit(),
    rollback: () => connection.rollback(),
    release: () => connection.release(),
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
