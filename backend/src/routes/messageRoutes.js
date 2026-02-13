import express from 'express';
import MessageController from '../controllers/messageController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  sendMessageValidation,
  getConversationValidation,
  markAsReadValidation,
  deleteMessageValidation,
  getInboxValidation,
  markMultipleAsReadValidation
} from '../validators/message.validator.js';

const router = express.Router();

/**
 * Message Routes
 * All routes require authentication and are restricted to academic roles
 * (department_head, instructor, student)
 */

// Middleware: Only academic roles can access messaging
const academicRolesOnly = authorize('department_head', 'instructor', 'student');

/**
 * @route   POST /messages/send
 * @desc    Send a new message
 * @access  Department Head, Instructor, Student
 */
router.post(
  '/send',
  authenticate,
  academicRolesOnly,
  sendMessageValidation,
  validateRequest,
  MessageController.sendMessage
);

/**
 * @route   GET /messages/inbox
 * @desc    Get inbox messages (received)
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/inbox',
  authenticate,
  academicRolesOnly,
  getInboxValidation,
  validateRequest,
  MessageController.getInbox
);

/**
 * @route   GET /messages/sent
 * @desc    Get sent messages
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/sent',
  authenticate,
  academicRolesOnly,
  getInboxValidation,
  validateRequest,
  MessageController.getSentMessages
);

/**
 * @route   GET /messages/conversations
 * @desc    Get all conversations list
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/conversations',
  authenticate,
  academicRolesOnly,
  MessageController.getConversationsList
);

/**
 * @route   GET /messages/conversation/:userId
 * @desc    Get conversation with specific user
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/conversation/:userId',
  authenticate,
  academicRolesOnly,
  getConversationValidation,
  validateRequest,
  MessageController.getConversation
);

/**
 * @route   GET /messages/unread-count
 * @desc    Get unread message count
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/unread-count',
  authenticate,
  academicRolesOnly,
  MessageController.getUnreadCount
);

/**
 * @route   GET /messages/messageable-users
 * @desc    Get users that current user can message
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/messageable-users',
  authenticate,
  academicRolesOnly,
  MessageController.getMessageableUsers
);

/**
 * @route   GET /messages/:messageId
 * @desc    Get message by ID
 * @access  Department Head, Instructor, Student
 */
router.get(
  '/:messageId',
  authenticate,
  academicRolesOnly,
  markAsReadValidation,
  validateRequest,
  MessageController.getMessageById
);

/**
 * @route   PATCH /messages/read/:messageId
 * @desc    Mark message as read
 * @access  Department Head, Instructor, Student
 */
router.patch(
  '/read/:messageId',
  authenticate,
  academicRolesOnly,
  markAsReadValidation,
  validateRequest,
  MessageController.markAsRead
);

/**
 * @route   PATCH /messages/read-multiple
 * @desc    Mark multiple messages as read
 * @access  Department Head, Instructor, Student
 */
router.patch(
  '/read-multiple',
  authenticate,
  academicRolesOnly,
  markMultipleAsReadValidation,
  validateRequest,
  MessageController.markMultipleAsRead
);

/**
 * @route   DELETE /messages/:messageId
 * @desc    Delete message (soft delete)
 * @access  Department Head, Instructor, Student
 */
router.delete(
  '/:messageId',
  authenticate,
  academicRolesOnly,
  deleteMessageValidation,
  validateRequest,
  MessageController.deleteMessage
);

export default router;
