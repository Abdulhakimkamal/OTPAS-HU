export const ROLES = {
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
};

export const ROLE_HIERARCHY = {
  admin: 4,
  department_head: 3,
  instructor: 2,
  student: 1,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  INVALID_TOKEN: 'Invalid or expired token',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database error',
};
