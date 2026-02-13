import MessageModel from '../models/message.model.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

/**
 * Message Controller
 * Handles all messaging operations with role-based access control
 */

class MessageController {
  /**
   * Send a new message
   * POST /messages/send
   */
  static async sendMessage(req, res, next) {
    try {
      const { receiver_id, subject, message_text, parent_message_id } = req.body;
      const sender_id = req.user.id;

      // Prevent self-messaging
      if (sender_id === receiver_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Cannot send message to yourself'
        });
      }

      // Check if sender can message receiver (department relationship)
      const canMessage = await MessageModel.canMessage(sender_id, receiver_id);
      if (!canMessage) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to message this user. Messages are restricted to users within your department and appropriate roles.'
        });
      }

      // Create message
      const message = await MessageModel.create({
        sender_id,
        receiver_id,
        subject,
        message_text,
        parent_message_id
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inbox messages (received)
   * GET /messages/inbox
   */
  static async getInbox(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;

      const messages = await MessageModel.getInbox(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === 'true'
      });

      const unreadCount = await MessageModel.getUnreadCount(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        messages,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: messages.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sent messages
   * GET /messages/sent
   */
  static async getSentMessages(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await MessageModel.getSentMessages(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: messages.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation with specific user
   * GET /messages/conversation/:userId
   */
  static async getConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const otherUserId = parseInt(req.params.userId);
      const { limit = 50, offset = 0 } = req.query;

      // Check if users can message each other
      const canMessage = await MessageModel.canMessage(userId, otherUserId);
      if (!canMessage) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to view this conversation'
        });
      }

      const messages = await MessageModel.getConversation(userId, otherUserId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: messages.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all conversations list
   * GET /messages/conversations
   */
  static async getConversationsList(req, res, next) {
    try {
      const userId = req.user.id;

      const conversations = await MessageModel.getConversationsList(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        conversations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark message as read
   * PATCH /messages/read/:messageId
   */
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const messageId = parseInt(req.params.messageId);

      // Get message to verify receiver
      const message = await MessageModel.getById(messageId);
      
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Message not found'
        });
      }

      if (message.receiver_id !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You can only mark your own messages as read'
        });
      }

      const updatedMessage = await MessageModel.markAsRead(messageId, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Message marked as read',
        data: updatedMessage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark multiple messages as read
   * PATCH /messages/read-multiple
   */
  static async markMultipleAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { messageIds } = req.body;

      const updatedMessages = await MessageModel.markMultipleAsRead(messageIds, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `${updatedMessages.length} messages marked as read`,
        data: updatedMessages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete message (soft delete)
   * DELETE /messages/:messageId
   */
  static async deleteMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const messageId = parseInt(req.params.messageId);

      // Get message to verify sender/receiver
      const message = await MessageModel.getById(messageId);
      
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Message not found'
        });
      }

      let deletedMessage;
      if (message.sender_id === userId) {
        deletedMessage = await MessageModel.deleteBySender(messageId, userId);
      } else if (message.receiver_id === userId) {
        deletedMessage = await MessageModel.deleteByReceiver(messageId, userId);
      } else {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You can only delete your own messages'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Message deleted successfully',
        data: deletedMessage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread message count
   * GET /messages/unread-count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await MessageModel.getUnreadCount(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        unreadCount: count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users that current user can message
   * GET /messages/messageable-users
   */
  static async getMessageableUsers(req, res, next) {
    try {
      const userId = req.user.id;
      const users = await MessageModel.getMessageableUsers(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        users
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get message by ID
   * GET /messages/:messageId
   */
  static async getMessageById(req, res, next) {
    try {
      const userId = req.user.id;
      const messageId = parseInt(req.params.messageId);

      const message = await MessageModel.getById(messageId);
      
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Verify user is sender or receiver
      if (message.sender_id !== userId && message.receiver_id !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to view this message'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: message
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MessageController;
