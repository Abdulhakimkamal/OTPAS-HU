/**
 * Feedback Validator
 * Validation rules for feedback-related operations
 */

import { body, param } from 'express-validator';

export const createFeedbackValidation = [
  body('feedback_text')
    .trim()
    .notEmpty().withMessage('Feedback text is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Feedback text must be between 10 and 1000 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('tutorial_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Tutorial ID must be a valid integer'),
];

export const updateFeedbackValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Feedback ID must be a valid integer'),
  
  body('feedback_text')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Feedback text must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['course', 'tutorial', 'system', 'instructor', 'general']).withMessage('Invalid feedback category'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

export const getFeedbackByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Feedback ID must be a valid integer'),
];

export const deleteFeedbackValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Feedback ID must be a valid integer'),
];

export default {
  createFeedbackValidation,
  updateFeedbackValidation,
  getFeedbackByIdValidation,
  deleteFeedbackValidation,
};
