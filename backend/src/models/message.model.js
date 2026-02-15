import pool from '../config/database.js';

/**
 * Message Model
 * Handles database operations for the messaging system
 */

class MessageModel {
  /**
   * Send a new message
   */
  static async create({ sender_id, receiver_id, subject, message_text, parent_message_id = null }) {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, subject, message_text, parent_message_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [sender_id, receiver_id, subject, message_text, parent_message_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get inbox messages for a user (received messages)
   */
  static async getInbox(userId, { limit = 50, offset = 0, unreadOnly = false }) {
    let query = `
      SELECT 
        m.*,
        u.full_name as sender_name,
        u.email as sender_email,
        r.name as sender_role,
        u.profile_picture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE m.receiver_id = $1 
        AND m.is_deleted_by_receiver = false
    `;
    
    const values = [userId];
    
    if (unreadOnly) {
      query += ` AND m.is_read = false`;
    }
    
    query += ` ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get sent messages for a user
   */
  static async getSentMessages(userId, { limit = 50, offset = 0 }) {
    const query = `
      SELECT 
        m.*,
        u.full_name as receiver_name,
        u.email as receiver_email,
        r.name as receiver_role,
        u.profile_picture as receiver_picture
      FROM messages m
      JOIN users u ON m.receiver_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE m.sender_id = $1 
        AND m.is_deleted_by_sender = false
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(userId, otherUserId, { limit = 50, offset = 0 }) {
    const query = `
      SELECT 
        m.*,
        sender.full_name as sender_name,
        sender_role.name as sender_role,
        sender.profile_picture as sender_picture,
        receiver.full_name as receiver_name,
        receiver_role.name as receiver_role,
        receiver.profile_picture as receiver_picture
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN roles sender_role ON sender.role_id = sender_role.id
      JOIN users receiver ON m.receiver_id = receiver.id
      JOIN roles receiver_role ON receiver.role_id = receiver_role.id
      WHERE (
        (m.sender_id = $1 AND m.receiver_id = $2 AND m.is_deleted_by_sender = false)
        OR 
        (m.sender_id = $2 AND m.receiver_id = $1 AND m.is_deleted_by_receiver = false)
      )
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [userId, otherUserId, limit, offset]);
    return result.rows;
  }

  /**
   * Get message by ID
   */
  static async getById(messageId) {
    const query = `
      SELECT 
        m.*,
        sender.full_name as sender_name,
        sender.email as sender_email,
        sender_role.name as sender_role,
        receiver.full_name as receiver_name,
        receiver.email as receiver_email,
        receiver_role.name as receiver_role
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN roles sender_role ON sender.role_id = sender_role.id
      JOIN users receiver ON m.receiver_id = receiver.id
      JOIN roles receiver_role ON receiver.role_id = receiver_role.id
      WHERE m.id = $1
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId, userId) {
    const query = `
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0];
  }

  /**
   * Mark multiple messages as read
   */
  static async markMultipleAsRead(messageIds, userId) {
    const query = `
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1) AND receiver_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [messageIds, userId]);
    return result.rows;
  }

  /**
   * Soft delete message (for sender)
   */
  static async deleteBySender(messageId, senderId) {
    const query = `
      UPDATE messages 
      SET is_deleted_by_sender = true
      WHERE id = $1 AND sender_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, senderId]);
    return result.rows[0];
  }

  /**
   * Soft delete message (for receiver)
   */
  static async deleteByReceiver(messageId, receiverId) {
    const query = `
      UPDATE messages 
      SET is_deleted_by_receiver = true
      WHERE id = $1 AND receiver_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, receiverId]);
    return result.rows[0];
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = $1 
        AND is_read = false 
        AND is_deleted_by_receiver = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get all conversations for a user
   */
  static async getConversationsList(userId) {
    const query = `
      SELECT DISTINCT ON (other_user_id)
        other_user_id,
        other_user_name,
        other_user_role,
        other_user_picture,
        last_message_text,
        last_message_time,
        unread_count
      FROM (
        SELECT 
          CASE 
            WHEN m.sender_id = $1 THEN m.receiver_id 
            ELSE m.sender_id 
          END as other_user_id,
          CASE 
            WHEN m.sender_id = $1 THEN receiver.full_name 
            ELSE sender.full_name 
          END as other_user_name,
          CASE 
            WHEN m.sender_id = $1 THEN receiver_role.name 
            ELSE sender_role.name 
          END as other_user_role,
          CASE 
            WHEN m.sender_id = $1 THEN receiver.profile_picture 
            ELSE sender.profile_picture 
          END as other_user_picture,
          m.message_text as last_message_text,
          m.created_at as last_message_time,
          (
            SELECT COUNT(*) 
            FROM messages 
            WHERE receiver_id = $1 
              AND sender_id = CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
              END
              AND is_read = false
              AND is_deleted_by_receiver = false
          ) as unread_count
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN roles sender_role ON sender.role_id = sender_role.id
        JOIN users receiver ON m.receiver_id = receiver.id
        JOIN roles receiver_role ON receiver.role_id = receiver_role.id
        WHERE (m.sender_id = $1 OR m.receiver_id = $1)
          AND (
            (m.sender_id = $1 AND m.is_deleted_by_sender = false)
            OR
            (m.receiver_id = $1 AND m.is_deleted_by_receiver = false)
          )
        ORDER BY m.created_at DESC
      ) conversations
      ORDER BY other_user_id, last_message_time DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Check if user can message another user (department relationship)
   */
  static async canMessage(senderId, receiverId) {
    const query = `
      SELECT 
        sender.id as sender_id,
        sender_role.name as sender_role,
        sender.department_id as sender_dept,
        receiver.id as receiver_id,
        receiver_role.name as receiver_role,
        receiver.department_id as receiver_dept
      FROM users sender
      JOIN roles sender_role ON sender.role_id = sender_role.id
      CROSS JOIN users receiver
      JOIN roles receiver_role ON receiver.role_id = receiver_role.id
      WHERE sender.id = $1 AND receiver.id = $2
    `;
    const result = await pool.query(query, [senderId, receiverId]);
    
    if (result.rows.length === 0) return false;
    
    const { sender_role, sender_dept, receiver_role, receiver_dept } = result.rows[0];
    
    // Admin and super_admin CAN message other users
    if (['admin', 'super_admin'].includes(sender_role)) return true;
    if (['admin', 'super_admin'].includes(receiver_role)) return true;
    
    // Must be in same department for non-admin users
    if (sender_dept !== receiver_dept) return false;
    
    // Department head can message instructors and students
    if (sender_role === 'department_head' && ['instructor', 'student'].includes(receiver_role)) {
      return true;
    }
    
    // Instructor can message department head and students
    if (sender_role === 'instructor' && ['department_head', 'student'].includes(receiver_role)) {
      return true;
    }
    
    // Student can message department head and instructor
    if (sender_role === 'student' && ['department_head', 'instructor'].includes(receiver_role)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get users that current user can message
   */
  static async getMessageableUsers(userId) {
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        r.name as role,
        u.profile_picture,
        u.is_active
      FROM users cu
      CROSS JOIN users u
      JOIN roles r ON u.role_id = r.id
      JOIN roles cr ON cu.role_id = cr.id
      WHERE cu.id = $1
        AND u.id != $1
        AND u.is_active = true
        AND u.department_id = cu.department_id
        AND r.name NOT IN ('admin', 'super_admin')
        AND cr.name NOT IN ('admin', 'super_admin')
        AND (
          (cr.name = 'department_head' AND r.name IN ('instructor', 'student'))
          OR
          (cr.name = 'instructor' AND r.name IN ('department_head', 'student'))
          OR
          (cr.name = 'student' AND r.name IN ('department_head', 'instructor'))
        )
      ORDER BY r.name, u.full_name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

export default MessageModel;
