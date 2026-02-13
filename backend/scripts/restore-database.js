import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: 'postgres', // Connect to postgres database first
};

const targetDbName = process.env.DB_NAME || 'academic_compass';

console.log('\n=== OTPAS-HU Database Restoration ===\n');
console.log('Configuration:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Target Database: ${targetDbName}\n`);

async function restoreDatabase() {
  const pool = new Pool(dbConfig);

  try {
    // Step 1: Check if database exists
    console.log('Step 1: Checking if database exists...');
    const dbCheck = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`  ✓ Database '${targetDbName}' does not exist. Creating...`);
      await pool.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`  ✓ Database '${targetDbName}' created successfully`);
    } else {
      console.log(`  ✓ Database '${targetDbName}' already exists`);
    }

    await pool.end();

    // Step 2: Connect to target database
    console.log('\nStep 2: Connecting to target database...');
    const targetPool = new Pool({
      ...dbConfig,
      database: targetDbName,
    });

    // Step 3: Check if tables exist
    console.log('\nStep 3: Checking database schema...');
    const tableCheck = await targetPool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tableCount = parseInt(tableCheck.rows[0].count);
    console.log(`  ✓ Found ${tableCount} tables in database`);

    if (tableCount === 0) {
      console.log('\nStep 4: Database is empty. Running schema...');
      
      // Run schema.sql
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await targetPool.query(schema);
        console.log('  ✓ Schema applied successfully');
      } else {
        console.log('  ⚠ schema.sql not found, skipping...');
      }
    } else {
      console.log('\nStep 4: Tables exist. Checking for missing tables...');
    }

    // Step 5: Run migrations
    console.log('\nStep 5: Checking and running migrations...');
    
    // Create migrations table if it doesn't exist
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedMigrations = await targetPool.query(
      'SELECT name FROM migrations ORDER BY executed_at'
    );
    const executedNames = executedMigrations.rows.map(row => row.name);

    // Get migration files
    const migrationsDir = path.join(__dirname, '../src/db/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`  Found ${migrationFiles.length} migration files`);
    console.log(`  Already executed: ${executedNames.length} migrations`);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedNames.includes(file)) {
        console.log(`  Running migration: ${file}...`);
        const migrationPath = path.join(migrationsDir, file);
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await targetPool.query(migration);
          await targetPool.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          console.log(`  ✓ Migration ${file} completed`);
        } catch (error) {
          console.log(`  ⚠ Migration ${file} failed (may already be applied): ${error.message}`);
        }
      } else {
        console.log(`  ✓ Migration ${file} already executed`);
      }
    }

    // Step 6: Verify and insert initial data
    console.log('\nStep 6: Verifying initial data...');

    // Check if roles exist
    const rolesCheck = await targetPool.query('SELECT COUNT(*) as count FROM roles');
    if (parseInt(rolesCheck.rows[0].count) === 0) {
      console.log('  Inserting roles...');
      await targetPool.query(`
        INSERT INTO roles (name, description, permissions) VALUES
        ('super_admin', 'Super Administrator with full system access', '{"all": true}'),
        ('admin', 'System Administrator with full access', '{"all": true}'),
        ('department_head', 'Department Head with department management access', '{"manage_department": true, "view_reports": true}'),
        ('instructor', 'Instructor/Faculty with course and tutorial management', '{"manage_courses": true, "manage_tutorials": true, "evaluate_students": true}'),
        ('student', 'Student with course enrollment and project submission', '{"enroll_courses": true, "submit_projects": true, "view_tutorials": true}')
        ON CONFLICT (name) DO NOTHING
      `);
      console.log('  ✓ Roles inserted');
    } else {
      console.log('  ✓ Roles already exist');
    }

    // Check if departments exist
    const deptsCheck = await targetPool.query('SELECT COUNT(*) as count FROM departments');
    if (parseInt(deptsCheck.rows[0].count) === 0) {
      console.log('  Inserting departments...');
      await targetPool.query(`
        INSERT INTO departments (name, code, description, contact_email, phone, location) VALUES
        ('Computer Science', 'CS', 'Department of Computer Science and Engineering', 'cs@haramaya.edu', '+251-911-234567', 'Building A, Floor 3'),
        ('Information Technology', 'IT', 'Department of Information Technology', 'it@haramaya.edu', '+251-911-234568', 'Building B, Floor 2'),
        ('Software Engineering', 'SE', 'Department of Software Engineering', 'se@haramaya.edu', '+251-911-234569', 'Building C, Floor 1'),
        ('Business Administration', 'BA', 'Department of Business Administration', 'ba@haramaya.edu', '+251-911-234570', 'Building D, Floor 2')
        ON CONFLICT (code) DO NOTHING
      `);
      console.log('  ✓ Departments inserted');
    } else {
      console.log('  ✓ Departments already exist');
    }

    // Check if super admin exists
    const superAdminCheck = await targetPool.query(
      `SELECT COUNT(*) as count FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = 'super_admin'`
    );

    if (parseInt(superAdminCheck.rows[0].count) === 0) {
      console.log('  Creating super admin user...');
      const superAdminPassword = await bcrypt.hash('superadmin123', 10);
      const roleResult = await targetPool.query("SELECT id FROM roles WHERE name = 'super_admin'");
      
      await targetPool.query(`
        INSERT INTO users (full_name, email, username, password_hash, role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (email) DO NOTHING
      `, ['Super Administrator', 'superadmin@haramaya.edu', 'superadmin', superAdminPassword, roleResult.rows[0].id]);
      
      console.log('  ✓ Super admin created (username: superadmin, password: superadmin123)');
    } else {
      console.log('  ✓ Super admin already exists');
    }

    // Check if admin users exist
    const adminCheck = await targetPool.query(
      `SELECT COUNT(*) as count FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = 'admin'`
    );

    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('  Creating admin users...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      const roleResult = await targetPool.query("SELECT id FROM roles WHERE name = 'admin'");
      
      await targetPool.query(`
        INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
        VALUES 
        ($1, $2, $3, $4, $5, 1, TRUE),
        ($6, $7, $8, $9, $10, 1, TRUE)
        ON CONFLICT (email) DO NOTHING
      `, [
        'Admin User 1', 'admin1@haramaya.edu', 'admin1', adminPassword, roleResult.rows[0].id,
        'Admin User 2', 'admin2@haramaya.edu', 'admin2', adminPassword, roleResult.rows[0].id
      ]);
      
      console.log('  ✓ Admin users created (username: admin1/admin2, password: admin123)');
    } else {
      console.log('  ✓ Admin users already exist');
    }

    // Step 7: Verify database
    console.log('\nStep 7: Verifying database...');
    const verification = await targetPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM roles) as roles_count,
        (SELECT COUNT(*) FROM departments) as departments_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM migrations) as migrations_count
    `);

    const stats = verification.rows[0];
    console.log('  Database Statistics:');
    console.log(`    Roles: ${stats.roles_count}`);
    console.log(`    Departments: ${stats.departments_count}`);
    console.log(`    Users: ${stats.users_count}`);
    console.log(`    Migrations: ${stats.migrations_count}`);

    await targetPool.end();

    console.log('\n✅ Database restoration completed successfully!\n');
    console.log('Login Credentials:');
    console.log('  Super Admin: superadmin / superadmin123');
    console.log('  Admin 1: admin1 / admin123');
    console.log('  Admin 2: admin2 / admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database restoration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run restoration
restoreDatabase();
