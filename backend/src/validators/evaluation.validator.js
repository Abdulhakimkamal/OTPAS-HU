/**
 * Evaluation Validator
 * Validation rules for evaluation-related operations
 */

import { body, param } from 'express-validator';

export const createEvaluationValidation = [
  body('project_id')
    .notEmpty().withMessage('Project ID is required')
    .isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
  
  body('evaluation_type')
    .notEmpty().withMessage('Evaluation type is required')
    .isIn(['proposal', 'project_progress', 'final_project', 'tutorial_assignment'])
    .withMessage('Evaluation type must be one of: proposal, project_progress, final_project, tutorial_assignment'),
  
  body('score')
    .notEmpty().withMessage('Score is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  
  body('feedback')
    .notEmpty().withMessage('Feedback is required')
    .trim()
    .isLength({ min: 10 }).withMessage('Feedback must be at least 10 characters')
    .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters'),
  
  body('recommendation')
    .notEmpty().withMessage('Recommendation is required')
    .trim()
    .isLength({ min: 1 }).withMessage('Recommendation cannot be empty'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Approved', 'Needs Revision', 'Rejected'])
    .withMessage('Status must be one of: Approved, Needs Revision, Rejected'),
];

export const updateEvaluationValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Evaluation ID must be a valid integer'),
  
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Feedback must be at least 10 characters')
    .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters'),
  
  body('recommendation')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Recommendation cannot be empty'),
  
  body('evaluation_type')
    .optional()
    .isIn(['proposal', 'project_progress', 'final_project', 'tutorial_assignment'])
    .withMessage('Evaluation type must be one of: proposal, project_progress, final_project, tutorial_assignment'),
  
  body('status')
    .optional()
    .isIn(['Approved', 'Needs Revision', 'Rejected'])
    .withMessage('Status must be one of: Approved, Needs Revision, Rejected'),
];

export const getEvaluationByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Evaluation ID must be a valid integer'),
];

export const deleteEvaluationValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Evaluation ID must be a valid integer'),
];

export default {
  createEvaluationValidation,
  updateEvaluationValidation,
  getEvaluationByIdValidation,
  deleteEvaluationValidation,
};
