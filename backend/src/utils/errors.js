/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

class AppError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = {}) {
    super(message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details = {}) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = {}) {
    super(message, 409, details);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = {}) {
    super(message, 500, details);
  }
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  handleError
};

const handleError = (err, res) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
