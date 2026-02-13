/**
 * Notification Model
 * Handles all notification-related database operations
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.3
 */

import pool from '../config/database.js';

class NotificationModel {
  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @param {number} notificationData.user_id - User ID
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type
   * @returns {Promise<Object>} Created notification
   */
  static async create(notificationData) {
    const { user_id, title, message, type } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [user_id, title, message, type];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find notifications for user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of notifications
   */
  static async findByUser(userId) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Mark all notifications as read for user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `;
    
    await pool.query(query, [userId]);
  }

  /**
   * Delete notification
   * @param {number} id - Notification ID
   * @returns {Promise<Object>} Deleted notification
   */
  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default NotificationModel;
