import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available (Render provides this), otherwise build from individual env vars
let pool;

if (process.env.DATABASE_URL) {
  // Render provides DATABASE_URL
  console.log('[INFO] Using DATABASE_URL from environment');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  // Local development
  console.log('[INFO] Using individual database environment variables');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'academic_compass',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
