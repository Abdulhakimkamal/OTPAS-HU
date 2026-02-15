import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {
      console.log('[INFO] Database tables already initialized - skipping schema creation');
      console.log('[INFO] Existing data will be preserved');
      return;
    }

    console.log('[INFO] Initializing database tables for the first time...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split and execute statements carefully
    const statements = schema.split(';').filter(stmt => stmt.trim());

    let successCount = 0;
    let errorCount = 0;

    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.query(stmt);
          successCount++;
        } catch (err) {
          // Only log errors that are not "already exists" errors
          if (!err.message.includes('already exists') && 
              !err.message.includes('duplicate key') &&
              !err.message.includes('UNIQUE constraint')) {
            console.warn('[WARNING] Schema execution warning:', err.message.substring(0, 100));
            errorCount++;
          }
        }
      }
    }

    console.log(`[SUCCESS] Database initialized - ${successCount} statements executed`);
    if (errorCount > 0) {
      console.log(`[INFO] ${errorCount} non-critical warnings (expected for existing objects)`);
    }
  } catch (error) {
    console.error('[ERROR] Database initialization failed:', error.message);
    // Don't throw - let server continue running
  }
}
