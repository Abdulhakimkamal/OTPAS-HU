export const ERROR_MESSAGES = {
  // Authentication
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_CREDENTIALS: 'Invalid email or password',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password does not meet requirements',
  PASSWORD_MISMATCH: 'Passwords do not match',
  
  // Database
  DATABASE_ERROR: 'Database error occurred',
  DUPLICATE_ENTRY: 'This entry already exists',
  NOT_FOUND: 'Resource not found',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USERNAME_TAKEN: 'Username already taken',
  EMAIL_TAKEN: 'Email already registered',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

export default ERROR_MESSAGES;
