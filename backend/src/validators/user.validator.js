/**
 * User Validator
 * Validation rules for user-related operations
 */

import { body, param, query } from 'express-validator';

export const createUserValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role_id')
    .notEmpty().withMessage('Role is required')
    .isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
  
  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
];

export const updateUserValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('role_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
  
  body('department_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
];

export const updatePasswordValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
  
  body('current_password')
    .notEmpty().withMessage('Current password is required'),
  
  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirm_password')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage('Passwords do not match'),
];

export const getUserByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
];

export const deleteUserValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
];

export const searchUsersValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  
  query('role')
    .optional()
    .trim()
    .isIn(['super_admin', 'admin', 'department_head', 'instructor', 'student']).withMessage('Invalid role'),
  
  query('department_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
];

export const loginValidation = [
  body('emailOrUsername')
    .trim()
    .notEmpty().withMessage('Email or username is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

export const updateProfileValidation = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional({ nullable: true })
    .trim(),
  
  body('bio')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
];

export default {
  createUserValidation,
  updateUserValidation,
  updatePasswordValidation,
  getUserByIdValidation,
  deleteUserValidation,
  searchUsersValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
};
