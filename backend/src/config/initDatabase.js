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
      console.log('[INFO] Database tables already initialized');
      return;
    }

    console.log('[INFO] Initializing database tables...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split and execute statements
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.query(stmt);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.error('[ERROR] Schema execution error:', err.message);
          }
        }
      }
    }

    console.log('[SUCCESS] Database initialized successfully');
  } catch (error) {
    console.error('[ERROR] Database initialization failed:', error.message);
  }
}
