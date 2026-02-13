import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || '5432',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'academic_compass',
};

async function createBackup() {
  try {
    console.log('\n=== Creating Database Backup ===\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✓ Created backups directory');
    }

    console.log(`Creating backup: ${backupFile}`);
    console.log('This may take a moment...\n');

    // Set password environment variable
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    // Create pg_dump command
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupFile}"`;

    try {
      await execAsync(command, { env });
      console.log('✅ Backup created successfully!');
      console.log(`   Location: ${backupFile}\n`);
      
      // Get file size
      const stats = fs.statSync(backupFile);
      const fileSizeInBytes = stats.size;
      const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
      console.log(`   Size: ${fileSizeInKB} KB\n`);
      
      return backupFile;
    } catch (error) {
      if (error.message.includes('pg_dump')) {
        console.log('⚠️  pg_dump not found in PATH. Creating manual backup...\n');
        return await createManualBackup(backupFile);
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function createManualBackup(backupFile) {
  const pg = await import('pg');
  const { Pool } = pg.default;
  
  const pool = new Pool({
    host: dbConfig.host,
    port: parseInt(dbConfig.port),
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  try {
    let sqlContent = `-- OTPAS-HU Database Backup
-- Database: ${dbConfig.database}
-- Date: ${new Date().toISOString()}
-- Host: ${dbConfig.host}:${dbConfig.port}

-- ============================================
-- RESTORE INSTRUCTIONS
-- ============================================
-- To restore this backup:
-- 1. Create database: CREATE DATABASE academic_compass;
-- 2. Run this file: psql -U postgres -d academic_compass -f backup.sql
-- Or use: node scripts/restore-from-backup.js
-- ============================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log(`Found ${tablesResult.rows.length} tables to backup...\n`);

    // Backup each table
    for (const { tablename } of tablesResult.rows) {
      console.log(`  Backing up table: ${tablename}`);
      
      // Get table structure
      const structureResult = await pool.query(`
        SELECT 
          'CREATE TABLE ' || tablename || ' (' ||
          string_agg(column_name || ' ' || data_type || 
            CASE 
              WHEN character_maximum_length IS NOT NULL 
              THEN '(' || character_maximum_length || ')' 
              ELSE '' 
            END, ', ') || ');' as create_statement
        FROM information_schema.columns
        WHERE table_name = $1
        GROUP BY tablename
      `, [tablename]);

      if (structureResult.rows.length > 0) {
        sqlContent += `\n-- Table: ${tablename}\n`;
        sqlContent += `DROP TABLE IF EXISTS ${tablename} CASCADE;\n`;
        // Note: This is simplified, actual structure is already in schema.sql
      }

      // Get table data
      const dataResult = await pool.query(`SELECT * FROM ${tablename}`);
      
      if (dataResult.rows.length > 0) {
        sqlContent += `\n-- Data for table: ${tablename}\n`;
        
        for (const row of dataResult.rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          
          sqlContent += `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }
    }

    // Write to file
    fs.writeFileSync(backupFile, sqlContent, 'utf8');
    
    const stats = fs.statSync(backupFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n✅ Manual backup created successfully!');
    console.log(`   Location: ${backupFile}`);
    console.log(`   Size: ${fileSizeInKB} KB\n`);

    await pool.end();
    return backupFile;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

createBackup().then(() => process.exit(0));
