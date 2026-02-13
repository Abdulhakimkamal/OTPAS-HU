/**
 * Notification Controller
 * Handles HTTP requests for notification management
 * Requirements: 6.10
 */

import NotificationService from '../services/notification.service.js';
import { handleError } from '../utils/errors.js';

class NotificationController {
  /**
   * Get all notifications for the authenticated user
   * GET /api/student/notifications
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;

      // Get all notifications for user
      const notifications = await NotificationService.getUserNotifications(userId);

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
        unreadCount: notifications.filter(n => !n.is_read).length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Mark a single notification as read
   * PATCH /api/student/notifications/:id/read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);

      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }

      // Mark notification as read
      const notification = await NotificationService.markAsRead(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Mark all notifications as read for the authenticated user
   * PATCH /api/student/notifications/read-all
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      // Mark all notifications as read
      await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/student/notifications/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);

      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }

      // Delete notification
      const notification = await NotificationService.deleteNotification(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get unread notification count
   * GET /api/student/notifications/unread/count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      // Get unread count
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        unreadCount
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }
}

export default NotificationController;
