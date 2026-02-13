/**
 * Recommendation Validator
 * Validation rules for recommendation-related operations
 */

import { body, param } from 'express-validator';

export const createRecommendationValidation = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  body('recommendation_text')
    .trim()
    .notEmpty().withMessage('Recommendation text is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Recommendation text must be between 20 and 2000 characters'),
  
  body('recommended_by')
    .notEmpty().withMessage('Recommender ID is required')
    .isInt({ min: 1 }).withMessage('Recommender ID must be a valid integer'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['academic', 'career', 'personal', 'research', 'project']).withMessage('Invalid recommendation category'),
];

export const updateRecommendationValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Recommendation ID must be a valid integer'),
  
  body('recommendation_text')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 }).withMessage('Recommendation text must be between 20 and 2000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['academic', 'career', 'personal', 'research', 'project']).withMessage('Invalid recommendation category'),
];

export const getRecommendationByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Recommendation ID must be a valid integer'),
];

export const deleteRecommendationValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Recommendation ID must be a valid integer'),
];

export default {
  createRecommendationValidation,
  updateRecommendationValidation,
  getRecommendationByIdValidation,
  deleteRecommendationValidation,
};
