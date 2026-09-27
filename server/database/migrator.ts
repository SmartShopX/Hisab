import { query } from '../config/database.js';
import { SCHEMA_SQL } from './schema.js';

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Running SmartShopX authoritative database migrations...');
    await query(SCHEMA_SQL);
    console.log('SmartShopX database migrations applied successfully.');
    return { success: true, message: 'Schema migrated successfully' };
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    return { success: false, message: error.message };
  }
}
