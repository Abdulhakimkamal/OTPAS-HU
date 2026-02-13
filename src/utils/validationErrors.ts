/**
 * Validation Error Utilities
 * Helper functions for handling backend validation errors
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

/**
 * Extract validation errors from API response
 */
export const extractValidationErrors = (error: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    error.response.data.errors.forEach((err: ValidationError) => {
      if (err.field) {
        errors[err.field] = err.message;
      }
    });
  }
  
  return errors;
};

/**
 * Get first error message from validation errors
 */
export const getFirstErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const firstError = error.response.data.errors[0];
    return firstError?.message || 'Validation failed';
  }
  
  return error?.message || 'An error occurred';
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  return error?.response?.status === 400 && 
         error?.response?.data?.errors && 
         Array.isArray(error.response.data.errors);
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.map(err => `${err.field}: ${err.message}`);
};

/**
 * Get error message for a specific field
 */
export const getFieldError = (errors: Record<string, string>, field: string): string | undefined => {
  return errors[field];
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors: Record<string, string>, field: string): boolean => {
  return !!errors[field];
};

/**
 * Clear error for a specific field
 */
export const clearFieldError = (
  errors: Record<string, string>, 
  field: string
): Record<string, string> => {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
};

/**
 * Client-side validation rules matching backend
 */
export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Must be a valid email address',
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Username must be 3-50 characters, alphanumeric with underscore or hyphen',
  },
  fullName: {
    minLength: 2,
    maxLength: 100,
    message: 'Full name must be between 2 and 100 characters',
  },
  departmentCode: {
    minLength: 2,
    maxLength: 10,
    pattern: /^[A-Z]+$/,
    message: 'Department code must be 2-10 uppercase letters',
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: 'Phone number must contain only digits and valid phone characters',
  },
  rating: {
    min: 1,
    max: 5,
    message: 'Rating must be between 1 and 5',
  },
  percentage: {
    min: 0,
    max: 100,
    message: 'Percentage must be between 0 and 100',
  },
};

/**
 * Validate email
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!validationRules.email.pattern.test(email)) {
    return validationRules.email.message;
  }
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < validationRules.password.minLength) {
    return `Password must be at least ${validationRules.password.minLength} characters`;
  }
  if (!validationRules.password.pattern.test(password)) {
    return validationRules.password.message;
  }
  return null;
};

/**
 * Validate username
 */
export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < validationRules.username.minLength) {
    return `Username must be at least ${validationRules.username.minLength} characters`;
  }
  if (username.length > validationRules.username.maxLength) {
    return `Username must not exceed ${validationRules.username.maxLength} characters`;
  }
  if (!validationRules.username.pattern.test(username)) {
    return validationRules.username.message;
  }
  return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate string length
 */
export const validateLength = (
  value: string, 
  min: number, 
  max: number, 
  fieldName: string
): string | null => {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${fieldName} must not exceed ${max} characters`;
  }
  return null;
};

/**
 * Validate number range
 */
export const validateRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): string | null => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * Create error message from error object
 */
export const createErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const firstError = error.response.data.errors[0];
    return firstError?.message || 'Validation failed';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An error occurred. Please try again.';
};
