/**
 * Department Validator
 * Validation rules for department-related operations
 */

import { body, param } from 'express-validator';

export const createDepartmentValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .notEmpty().withMessage('Department code is required')
    .isLength({ min: 2, max: 10 }).withMessage('Department code must be between 2 and 10 characters')
    .matches(/^[A-Z]+$/).withMessage('Department code must be uppercase letters only'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  
  body('contact_email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number must contain only digits, spaces, and valid phone characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
];

export const updateDepartmentValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Department code must be between 2 and 10 characters')
    .matches(/^[A-Z]+$/).withMessage('Department code must be uppercase letters only'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  
  body('contact_email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number must contain only digits, spaces, and valid phone characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
];

export const getDepartmentByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
];

export const deleteDepartmentValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
];

export default {
  createDepartmentValidation,
  updateDepartmentValidation,
  getDepartmentByIdValidation,
  deleteDepartmentValidation,
};
