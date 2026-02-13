/**
 * Role Validator
 * Validation rules for role-related operations
 */

import { body, param } from 'express-validator';

export const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-z_]+$/).withMessage('Role name must be lowercase with underscores only'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 255 }).withMessage('Description must be between 10 and 255 characters'),
  
  body('permissions')
    .notEmpty().withMessage('Permissions are required')
    .isObject().withMessage('Permissions must be a valid JSON object'),
];

export const updateRoleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-z_]+$/).withMessage('Role name must be lowercase with underscores only'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 255 }).withMessage('Description must be between 10 and 255 characters'),
  
  body('permissions')
    .optional()
    .isObject().withMessage('Permissions must be a valid JSON object'),
];

export const getRoleByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
];

export const deleteRoleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
];

export default {
  createRoleValidation,
  updateRoleValidation,
  getRoleByIdValidation,
  deleteRoleValidation,
};
