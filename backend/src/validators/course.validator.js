/**
 * Course Validator
 * Validation rules for course-related operations
 */

import { body, param } from 'express-validator';

export const createCourseValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ min: 3, max: 150 }).withMessage('Course name must be between 3 and 150 characters'),
  
  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Course code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9\-]+$/).withMessage('Course code must contain only uppercase letters, numbers, and hyphens'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  
  body('credits')
    .notEmpty().withMessage('Credits are required')
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  
  body('department_id')
    .notEmpty().withMessage('Department is required')
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
  
  body('instructor_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Instructor ID must be a valid integer'),
];

export const updateCourseValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Course ID must be a valid integer'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Course name must be between 3 and 150 characters'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Course code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9\-]+$/).withMessage('Course code must contain only uppercase letters, numbers, and hyphens'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  
  body('department_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer'),
  
  body('instructor_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Instructor ID must be a valid integer'),
];

export const getCourseByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Course ID must be a valid integer'),
];

export const deleteCourseValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Course ID must be a valid integer'),
];

export default {
  createCourseValidation,
  updateCourseValidation,
  getCourseByIdValidation,
  deleteCourseValidation,
};
