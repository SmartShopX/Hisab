import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

let pool: Pool | null = null;
let isDbAvailable: boolean | null = null;
let lastConnectionAttempt = 0;
const RETRY_INTERVAL_MS = 20000;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.SQL_HOST || process.env.PGHOST);
}

export function getDatabaseConfig(): DatabaseConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: process.env.SQL_HOST || process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.SQL_PORT || process.env.PGPORT || '5432', 10),
    user: process.env.SQL_USER || process.env.PGUSER || 'postgres',
    password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || '',
    database: process.env.SQL_DB_NAME || process.env.PGDATABASE || 'smartshopx',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

export function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool({
      ...config,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err: any) => {
      const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
      if (!isConnRefused) {
        console.error('Unexpected error on idle PostgreSQL client:', err);
      }
    });
  }
  return pool;
}

/**
 * Execute parameterized query with connection safety
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  // Fast fail in development mode if database is not configured and known to be offline
  if (!isDatabaseConfigured() && isDbAvailable === false && Date.now() - lastConnectionAttempt < RETRY_INTERVAL_MS) {
    const offlineErr: any = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    offlineErr.code = 'ECONNREFUSED';
    throw offlineErr;
  }

  const start = Date.now();
  try {
    const pool = getPool();
    const res = await pool.query<T>(text, params);
    isDbAvailable = true;
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    const isConnRefused =
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_INVALID_URL' ||
      error.code === '42P01' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('Invalid URL') ||
      error.message?.includes('does not exist');
    if (isConnRefused) {
      isDbAvailable = false;
      lastConnectionAttempt = Date.now();
      if (process.env.DEBUG_SQL === 'true') {
        console.warn('PostgreSQL unreachable or missing schema, operating in safe local fallback:', error.message);
      }
      const offlineErr: any = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      offlineErr.code = 'ECONNREFUSED';
      throw offlineErr;
    } else {
      console.error('PostgreSQL query error:', {
        text,
        error: error.message,
        code: error.code,
      });
    }
    throw error;
  }
}

/**
 * Execute atomic transaction
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  let client: PoolClient;
  try {
    const pool = getPool();
    client = await pool.connect();
  } catch (err: any) {
    const isConnRefused =
      err.code === 'ECONNREFUSED' ||
      err.code === 'ERR_INVALID_URL' ||
      err.code === '42P01' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('Invalid URL');
    if (isConnRefused) {
      isDbAvailable = false;
      const offlineErr: any = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      offlineErr.code = 'ECONNREFUSED';
      throw offlineErr;
    }
    throw err;
  }

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    const isConnRefused =
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_INVALID_URL' ||
      error.code === '42P01' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('Invalid URL') ||
      error.message?.includes('does not exist');
    if (isConnRefused) {
      isDbAvailable = false;
      const offlineErr: any = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      offlineErr.code = 'ECONNREFUSED';
      throw offlineErr;
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Database health check
 */
export async function checkDbHealth(): Promise<{ status: 'healthy' | 'unreachable'; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    isDbAvailable = true;
    lastConnectionAttempt = Date.now();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error: any) {
    isDbAvailable = false;
    lastConnectionAttempt = Date.now();
    return { status: 'unreachable', error: error.message };
  }
}

/**
 * Safely terminate connection pool (for tests and graceful server shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch (err: any) {
      // Ignore if already ended
    }
    pool = null;
    isDbAvailable = null;
  }
}
