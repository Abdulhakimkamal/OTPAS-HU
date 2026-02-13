/**
 * Instructor Recommendation Validator
 * Validation rules for instructor recommendation operations
 */

import { body, param, query } from 'express-validator';

export const createRecommendationValidation = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  body('recommendation_type')
    .notEmpty().withMessage('Recommendation type is required')
    .isIn(['Academic', 'Project', 'Skill', 'Performance', 'Career', 'Mentorship'])
    .withMessage('Invalid recommendation type'),
  
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  
  body('priority_level')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Submitted', 'Reviewed']).withMessage('Invalid status'),
  
  body('evaluation_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Evaluation ID must be a valid integer'),
];

export const updateRecommendationValidation = [
  param('id')
    .isUUID().withMessage('Recommendation ID must be a valid UUID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  
  body('recommendation_type')
    .optional()
    .isIn(['Academic', 'Project', 'Skill', 'Performance', 'Career', 'Mentorship'])
    .withMessage('Invalid recommendation type'),
  
  body('priority_level')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Submitted', 'Reviewed']).withMessage('Invalid status'),
];

export const getRecommendationByIdValidation = [
  param('id')
    .isUUID().withMessage('Recommendation ID must be a valid UUID'),
];

export const deleteRecommendationValidation = [
  param('id')
    .isUUID().withMessage('Recommendation ID must be a valid UUID'),
];

export const getRecommendationsValidation = [
  query('student_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Student ID must be a valid integer'),
  
  query('recommendation_type')
    .optional()
    .isIn(['Academic', 'Project', 'Skill', 'Performance', 'Career', 'Mentorship'])
    .withMessage('Invalid recommendation type'),
  
  query('status')
    .optional()
    .isIn(['Draft', 'Submitted', 'Reviewed']).withMessage('Invalid status'),
  
  query('priority_level')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level'),
];

export const markAsReadValidation = [
  param('id')
    .isUUID().withMessage('Recommendation ID must be a valid UUID'),
];

export default {
  createRecommendationValidation,
  updateRecommendationValidation,
  getRecommendationByIdValidation,
  deleteRecommendationValidation,
  getRecommendationsValidation,
  markAsReadValidation,
};