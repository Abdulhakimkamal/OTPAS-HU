import fs from 'fs';
import path from 'path';
import pool from '../src/config/database.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../src/db/migrations');

// Create migrations table if it doesn't exist
async function createMigrationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Migrations table ready');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

// Get list of executed migrations
async function getExecutedMigrations() {
  try {
    const result = await pool.query('SELECT name FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error fetching executed migrations:', error);
    throw error;
  }
}

// Get list of migration files
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    return files;
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    throw error;
  }
}

// Run a single migration
async function runMigration(filename) {
  try {
    const filepath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filepath, 'utf8');

    // Execute migration
    await pool.query(sql);

    // Record migration
    await pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [filename]
    );

    console.log(`✓ Executed: ${filename}`);
  } catch (error) {
    console.error(`✗ Error executing ${filename}:`, error.message);
    throw error;
  }
}

// Main migration runner
async function runMigrations() {
  try {
    console.log('\n=== OTPAS-HU Database Migrations ===\n');

    // Create migrations table
    await createMigrationsTable();

    // Get executed and pending migrations
    const executed = await getExecutedMigrations();
    const files = getMigrationFiles();
    const pending = files.filter(file => !executed.includes(file));

    if (pending.length === 0) {
      console.log('✓ All migrations are up to date\n');
      process.exit(0);
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    // Run pending migrations
    for (const file of pending) {
      await runMigration(file);
    }

    console.log('\n✓ All migrations completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
