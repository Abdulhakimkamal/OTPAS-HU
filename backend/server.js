import app from './app.js';
import pool from './src/config/database.js';
import { initializeDatabase } from './src/config/initDatabase.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || process.env.RENDER_EXTERNAL_PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize database on startup
await initializeDatabase();

// Run migrations
async function runMigrations() {
  try {
    console.log('[INFO] Checking for pending migrations...');
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedResult = await pool.query('SELECT name FROM migrations ORDER BY executed_at');
    const executed = executedResult.rows.map(row => row.name);

    // Get migration files
    const migrationsDir = path.join(__dirname, 'src/db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Find pending migrations
    const pending = files.filter(file => !executed.includes(file));

    if (pending.length === 0) {
      console.log('[INFO] All migrations are up to date');
      return;
    }

    console.log(`[INFO] Running ${pending.length} pending migration(s)...`);

    // Run pending migrations
    for (const file of pending) {
      try {
        const filepath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filepath, 'utf8');
        
        // Execute migration
        await pool.query(sql);
        
        // Record migration
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        console.log(`[SUCCESS] Executed migration: ${file}`);
      } catch (error) {
        console.error(`[WARNING] Error executing migration ${file}:`, error.message);
        // Continue with next migration instead of failing
      }
    }

    console.log('[SUCCESS] Migration check completed');
  } catch (error) {
    console.error('[WARNING] Migration error:', error.message);
    // Don't fail server startup if migrations fail
  }
}

// Run migrations
await runMigrations();

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('[WARNING] Database connection error:', err.message);
    console.error('Server will continue running without database');
  } else {
    console.log('[SUCCESS] Database connected successfully');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SUCCESS] Server running on port ${PORT}`);
  console.log(`[INFO] Environment: ${NODE_ENV}`);
  console.log(`[INFO] URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    pool.end();
    process.exit(0);
  });
});
