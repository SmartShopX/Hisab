import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export interface ColumnSchema {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
}

export interface TableSchemaInfo {
  name: string;
  rowCount: number;
  columns: ColumnSchema[];
}

export interface SupabaseDebugResponse {
  connected: boolean;
  projectUrl: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  version?: string;
  serverTime?: string;
  latencyMs: number;
  timestamp: string;
  tableCount: number;
  tables: TableSchemaInfo[];
  error?: string;
}

// Dedicated Supabase connection helper
function getSupabasePool() {
  const rawUrl = process.env.DATABASE_URL || '';
  let host = 'db.ffqwfrtpscivirlvvxol.supabase.co';
  let port = 5432;
  let user = 'postgres';
  let database = 'postgres';
  let password = '';
  let projectUrl = 'https://ffqwfrtpscivirlvvxol.supabase.co';

  if (rawUrl) {
    const match = rawUrl.match(/^postgresql:\/\/([^:]+):(.+)@([^@:]+):(\d+)\/(.+)$/);
    if (match) {
      user = match[1];
      password = match[2];
      host = match[3];
      port = parseInt(match[4], 10);
      database = match[5];

      const projectRefMatch = host.match(/^db\.([^.]+)\.supabase\.co$/);
      if (projectRefMatch) {
        projectUrl = `https://${projectRefMatch[1]}.supabase.co`;
      }
    }
  }

  const pool = new Pool({
    user,
    password,
    host,
    port,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
    idleTimeoutMillis: 10000,
    max: 3,
  });

  return { pool, projectUrl, host, port, database, user };
}

router.get('/', async (_req: Request, res: Response) => {
  const start = Date.now();
  const { pool, projectUrl, host, port, database, user } = getSupabasePool();

  try {
    const pingStart = Date.now();
    const infoRes = await pool.query(`
      SELECT 
        NOW() as server_time,
        current_database() as db_name,
        current_user as db_user,
        version() as pg_version
    `);
    const latencyMs = Date.now() - pingStart;

    const row = infoRes.rows[0] || {};
    const version = row.pg_version || 'PostgreSQL';
    const serverTime = row.server_time ? new Date(row.server_time).toISOString() : new Date().toISOString();

    // Query all public tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    const tableNames: string[] = tablesRes.rows.map((r: any) => r.table_name);
    const tables: TableSchemaInfo[] = [];

    for (const tbl of tableNames) {
      const colsRes = await pool.query(`
        SELECT 
          column_name as "columnName",
          data_type as "dataType",
          is_nullable as "isNullable",
          column_default as "columnDefault"
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position ASC
      `, [tbl]);

      let rowCount = 0;
      try {
        const countRes = await pool.query(`SELECT COUNT(*) as cnt FROM "${tbl}"`);
        rowCount = parseInt(countRes.rows[0]?.cnt || '0', 10);
      } catch {
        rowCount = 0;
      }

      tables.push({
        name: tbl,
        rowCount,
        columns: colsRes.rows.map((c: any) => ({
          columnName: c.columnName,
          dataType: c.dataType,
          isNullable: c.isNullable === 'YES',
          columnDefault: c.columnDefault,
        })),
      });
    }

    await pool.end().catch(() => {});

    const response: SupabaseDebugResponse = {
      connected: true,
      projectUrl,
      host,
      port,
      database: row.db_name || database,
      user: row.db_user || user,
      ssl: true,
      version,
      serverTime,
      latencyMs,
      timestamp: new Date().toISOString(),
      tableCount: tables.length,
      tables,
    };

    return res.json(response);
  } catch (error: any) {
    await pool.end().catch(() => {});
    const latencyMs = Date.now() - start;
    const response: SupabaseDebugResponse = {
      connected: false,
      projectUrl,
      host,
      port,
      database,
      user,
      ssl: true,
      latencyMs,
      timestamp: new Date().toISOString(),
      tableCount: 0,
      tables: [],
      error: error.message || 'Failed to connect to Supabase backend',
    };

    return res.status(200).json(response);
  }
});

export default router;
