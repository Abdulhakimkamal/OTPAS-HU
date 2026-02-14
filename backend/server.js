import app from './app.js';
import pool from './src/config/database.js';
import { initializeDatabase } from './src/config/initDatabase.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || process.env.RENDER_EXTERNAL_PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize database on startup
await initializeDatabase();

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
