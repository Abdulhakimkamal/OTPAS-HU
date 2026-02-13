/**
 * Project Validator
 * Validation rules for project-related operations
 * 
 * Validates:
 * - Requirements 10.1: Title not empty
 * - Requirements 10.2: Description minimum 20 characters
 */

import { body, param } from 'express-validator';

/**
 * Validation for project title submission
 * POST /api/student/project/title
 */
export const submitTitleValidation = [
  body('instructor_id')
    .notEmpty().withMessage('Instructor ID is required')
    .isInt({ min: 1 }).withMessage('Instructor ID must be a valid integer'),
  
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters')
    .custom((value) => {
      if (value.trim().length === 0) {
        throw new Error('Title cannot be empty or contain only whitespace');
      }
      return true;
    }),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Project description is required')
    .isLength({ min: 20, max: 5000 }).withMessage('Description must be at least 20 characters and not exceed 5000 characters'),
];

/**
 * Validation for project title approval
 * PATCH /api/instructor/project/:id/approve
 */
export const approveTitleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
];

/**
 * Validation for project title rejection/disapproval
 * PATCH /api/instructor/project/:id/disapprove
 */
export const disapproveTitleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Rejection reason must not exceed 1000 characters'),
];

/**
 * Validation for getting project by ID
 * GET /api/student/project/:id/status
 */
export const getProjectByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
];

/**
 * Validation for requesting title submissions
 * POST /api/instructor/project/request-title
 */
export const requestTitleValidation = [
  body('student_ids')
    .isArray({ min: 1 }).withMessage('Student IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('All student IDs must be valid positive integers');
      }
      return true;
    }),
];

/**
 * Validation for file upload
 * POST /api/student/project/:id/upload
 */
export const uploadFileValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
];

export default {
  submitTitleValidation,
  approveTitleValidation,
  disapproveTitleValidation,
  getProjectByIdValidation,
  requestTitleValidation,
  uploadFileValidation,
};
