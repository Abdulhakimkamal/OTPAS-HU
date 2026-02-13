#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL database with schema and sample data
 * Usage: node scripts/init-database.js
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: 'postgres', // Connect to default database first
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database initialization...\n');

    // Step 1: Create database if not exists
    console.log('📦 Creating database...');
    await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'academic_compass'
    `).then(async (res) => {
      if (res.rows.length === 0) {
        await client.query('CREATE DATABASE academic_compass');
        console.log('✅ Database created\n');
      } else {
        console.log('✅ Database already exists\n');
      }
    });

    // Disconnect from postgres db and connect to academic_compass
    client.release();
    const mainPool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123456',
      database: 'academic_compass',
    });

    const mainClient = await mainPool.connect();

    try {
      // Step 2: Read and execute schema
      console.log('📋 Executing schema...');
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (stmt) {
          try {
            await mainClient.query(stmt);
          } catch (err) {
            // Ignore "already exists" errors
            if (!err.message.includes('already exists')) {
              console.error(`Error executing statement ${i + 1}:`, err.message);
            }
          }
        }
      }
      console.log('✅ Schema executed\n');

      // Step 3: Verify tables
      console.log('🔍 Verifying tables...');
      const tablesResult = await mainClient.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(r => r.table_name);
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(t => console.log(`   - ${t}`));
      console.log();

      // Step 4: Verify indexes
      console.log('🔍 Verifying indexes...');
      const indexesResult = await mainClient.query(`
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'public' 
        ORDER BY indexname
      `);
      
      const indexes = indexesResult.rows.map(r => r.indexname);
      console.log(`✅ Found ${indexes.length} indexes\n`);

      // Step 5: Verify views
      console.log('🔍 Verifying views...');
      const viewsResult = await mainClient.query(`
        SELECT table_name FROM information_schema.views 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const views = viewsResult.rows.map(r => r.table_name);
      console.log(`✅ Found ${views.length} views:`);
      views.forEach(v => console.log(`   - ${v}`));
      console.log();

      // Step 6: Verify sample data
      console.log('🔍 Verifying sample data...');
      const rolesCount = await mainClient.query('SELECT COUNT(*) FROM roles');
      const deptCount = await mainClient.query('SELECT COUNT(*) FROM departments');
      const usersCount = await mainClient.query('SELECT COUNT(*) FROM users');
      const skillsCount = await mainClient.query('SELECT COUNT(*) FROM skills');

      console.log(`✅ Sample data loaded:`);
      console.log(`   - Roles: ${rolesCount.rows[0].count}`);
      console.log(`   - Departments: ${deptCount.rows[0].count}`);
      console.log(`   - Users: ${usersCount.rows[0].count}`);
      console.log(`   - Skills: ${skillsCount.rows[0].count}`);
      console.log();

      console.log('✨ Database initialization completed successfully!\n');
      console.log('📊 Database Statistics:');
      console.log(`   - Tables: ${tables.length}`);
      console.log(`   - Indexes: ${indexes.length}`);
      console.log(`   - Views: ${views.length}`);
      console.log();
      console.log('🚀 Ready to use!\n');

    } finally {
      mainClient.release();
      await mainPool.end();
    }

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
