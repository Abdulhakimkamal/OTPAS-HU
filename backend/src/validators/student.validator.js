/**
 * Student Validator
 * Validation rules for student-related operations by Department Head
 */

import { body, param, query } from 'express-validator';

export const createStudentValidation = [
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
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('student_id')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Student ID must be between 3 and 50 characters'),
  
  body('phone')
    .optional({ nullable: true })
    .trim(),
  
  body('year')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Year must be between 1 and 7'),
];

export const updateStudentValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
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
  
  body('student_id')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Student ID must be between 3 and 50 characters'),
  
  body('year')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Year must be between 1 and 7'),
];

export const getStudentValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
];

export const updateStudentStatusValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  body('is_active')
    .isBoolean().withMessage('Status must be a boolean'),
];

export const resetStudentPasswordValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const searchStudentsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  
  query('year')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Year must be between 1 and 7'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export default {
  createStudentValidation,
  updateStudentValidation,
  getStudentValidation,
  updateStudentStatusValidation,
  resetStudentPasswordValidation,
  searchStudentsValidation,
};
