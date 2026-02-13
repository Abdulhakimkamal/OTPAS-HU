/**
 * Progress Validator
 * Validation rules for progress-related operations
 */

import { body, param } from 'express-validator';

export const createProgressValidation = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  body('course_id')
    .notEmpty().withMessage('Course ID is required')
    .isInt({ min: 1 }).withMessage('Course ID must be a valid integer'),
  
  body('completion_percentage')
    .notEmpty().withMessage('Completion percentage is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100'),
  
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['not_started', 'in_progress', 'completed', 'on_hold']).withMessage('Invalid status'),
];

export const updateProgressValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Progress ID must be a valid integer'),
  
  body('completion_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100'),
  
  body('status')
    .optional()
    .trim()
    .isIn(['not_started', 'in_progress', 'completed', 'on_hold']).withMessage('Invalid status'),
];

export const getProgressByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Progress ID must be a valid integer'),
];

export const deleteProgressValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Progress ID must be a valid integer'),
];

export default {
  createProgressValidation,
  updateProgressValidation,
  getProgressByIdValidation,
  deleteProgressValidation,
};
