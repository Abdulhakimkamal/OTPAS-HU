/**
 * Validation Request Middleware
 * Handles validation errors from express-validator
 */

import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 * Use this after validation rules in routes
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

export default validateRequest;
