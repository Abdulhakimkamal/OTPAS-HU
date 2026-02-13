import app from './app.js';
import pool from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('⚠️ Database connection error:', err.message);
    console.error('Server will continue running without database');
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(✅ Server running on port ${PORT});
  console.log(📍 Environment: ${NODE_ENV});
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