import { HTTP_STATUS } from '../config/constants.js';

export const errorHandler = (err, req, res, next) => {
  console.error('=== ERROR CAUGHT ===');
  console.error('URL:', req.method, req.url);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('==================');

  // Handle custom AppError instances
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
        details: err.details
      }
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  res.status(err.status || HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
};
