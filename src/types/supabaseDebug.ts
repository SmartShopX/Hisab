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
