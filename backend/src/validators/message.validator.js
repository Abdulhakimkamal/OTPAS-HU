import { body, param, query } from 'express-validator';

/**
 * Message Validators
 * Validation rules for messaging system
 */

export const sendMessageValidation = [
  body('receiver_id')
    .notEmpty()
    .withMessage('Receiver is required')
    .isInt({ min: 1 })
    .withMessage('Invalid receiver ID'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject must not exceed 255 characters'),
  
  body('message_text')
    .notEmpty()
    .withMessage('Message text is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  
  body('parent_message_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid parent message ID')
];

export const getConversationValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

export const markAsReadValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid message ID')
];

export const deleteMessageValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid message ID')
];

export const getInboxValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
];

export const markMultipleAsReadValidation = [
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('messageIds must be a non-empty array'),
  
  body('messageIds.*')
    .isInt({ min: 1 })
    .withMessage('Each message ID must be a valid integer')
];
