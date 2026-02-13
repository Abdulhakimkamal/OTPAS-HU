import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'academic_compass',
});

async function exportDatabase() {
  try {
    console.log('\n=== Exporting Database to SQL File ===\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(__dirname, '../database');
    const backupFile = path.join(backupDir, `database_backup_${timestamp}.sql`);

    // Create directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let sql = `-- ============================================
-- OTPAS-HU Database Backup
-- Database: academic_compass
-- Date: ${new Date().toISOString()}
-- ============================================
-- 
-- RESTORE INSTRUCTIONS:
-- 1. Create database: CREATE DATABASE academic_compass;
-- 2. Connect: psql -U postgres -d academic_compass
-- 3. Run: \\i database_backup_${timestamp}.sql
-- Or use: node scripts/restore-database.js
-- 
-- ============================================

`;

    // Export roles
    console.log('Exporting roles...');
    const roles = await pool.query('SELECT * FROM roles ORDER BY id');
    sql += `\n-- ============================================\n`;
    sql += `-- ROLES (${roles.rows.length} records)\n`;
    sql += `-- ============================================\n\n`;
    
    for (const role of roles.rows) {
      sql += `INSERT INTO roles (id, name, description, permissions) VALUES (${role.id}, '${role.name}', '${role.description?.replace(/'/g, "''")}', '${JSON.stringify(role.permissions)}') ON CONFLICT (name) DO NOTHING;\n`;
    }

    // Export departments
    console.log('Exporting departments...');
    const departments = await pool.query('SELECT * FROM departments ORDER BY id');
    sql += `\n-- ============================================\n`;
    sql += `-- DEPARTMENTS (${departments.rows.length} records)\n`;
    sql += `-- ============================================\n\n`;
    
    for (const dept of departments.rows) {
      sql += `INSERT INTO departments (id, name, code, description, contact_email, phone, location) VALUES (${dept.id}, '${dept.name}', '${dept.code}', ${dept.description ? `'${dept.description.replace(/'/g, "''")}'` : 'NULL'}, ${dept.contact_email ? `'${dept.contact_email}'` : 'NULL'}, ${dept.phone ? `'${dept.phone}'` : 'NULL'}, ${dept.location ? `'${dept.location}'` : 'NULL'}) ON CONFLICT (code) DO NOTHING;\n`;
    }

    // Export users
    console.log('Exporting users...');
    const users = await pool.query('SELECT * FROM users ORDER BY id');
    sql += `\n-- ============================================\n`;
    sql += `-- USERS (${users.rows.length} records)\n`;
    sql += `-- ============================================\n\n`;
    
    for (const user of users.rows) {
      sql += `INSERT INTO users (id, full_name, email, username, password_hash, role_id, department_id, is_active, created_at) VALUES (${user.id}, '${user.full_name}', '${user.email}', '${user.username}', '${user.password_hash}', ${user.role_id}, ${user.department_id || 'NULL'}, ${user.is_active}, '${user.created_at.toISOString()}') ON CONFLICT (email) DO NOTHING;\n`;
    }

    // Export migrations
    console.log('Exporting migrations...');
    const migrations = await pool.query('SELECT * FROM migrations ORDER BY id');
    sql += `\n-- ============================================\n`;
    sql += `-- MIGRATIONS (${migrations.rows.length} records)\n`;
    sql += `-- ============================================\n\n`;
    
    for (const migration of migrations.rows) {
      sql += `INSERT INTO migrations (name, executed_at) VALUES ('${migration.name}', '${migration.executed_at.toISOString()}') ON CONFLICT (name) DO NOTHING;\n`;
    }

    // Write to file
    fs.writeFileSync(backupFile, sql, 'utf8');

    const stats = fs.statSync(backupFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    console.log('\n✅ Database exported successfully!');
    console.log(`   Location: ${backupFile}`);
    console.log(`   Size: ${fileSizeInKB} KB`);
    console.log(`\n   Summary:`);
    console.log(`   - Roles: ${roles.rows.length}`);
    console.log(`   - Departments: ${departments.rows.length}`);
    console.log(`   - Users: ${users.rows.length}`);
    console.log(`   - Migrations: ${migrations.rows.length}\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

exportDatabase();
