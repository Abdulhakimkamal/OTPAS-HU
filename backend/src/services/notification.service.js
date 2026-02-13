/**
 * Notification Service Layer
 * Handles business logic for notification management
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import NotificationModel from '../models/notification.model.js';

class NotificationService {
  /**
   * Create title approval notification
   * Notifies student that their project title has been approved
   * @param {number} studentId - Student ID
   * @param {string} projectTitle - Project title
   * @returns {Promise<Object>} Created notification
   */
  static async notifyTitleApproval(studentId, projectTitle) {
    return await NotificationModel.create({
      user_id: studentId,
      title: 'Project Title Approved',
      message: `Your project title "${projectTitle}" has been approved by your instructor. You can now upload project files.`,
      type: 'title_approved'
    });
  }

  /**
   * Create title rejection notification
   * Notifies student that their project title has been rejected
   * @param {number} studentId - Student ID
   * @param {string} projectTitle - Project title
   * @param {string} reason - Optional reason for rejection
   * @returns {Promise<Object>} Created notification
   */
  static async notifyTitleRejection(studentId, projectTitle, reason = null) {
    const message = reason
      ? `Your project title "${projectTitle}" has been rejected by your instructor. Reason: ${reason}. Please submit a new title.`
      : `Your project title "${projectTitle}" has been rejected by your instructor. Please submit a new title.`;

    return await NotificationModel.create({
      user_id: studentId,
      title: 'Project Title Rejected',
      message,
      type: 'title_rejected'
    });
  }

  /**
   * Create evaluation completion notification
   * Notifies student that their evaluation has been completed
   * @param {number} studentId - Student ID
   * @param {string} evaluationType - Type of evaluation (proposal, project_progress, final_project, tutorial_assignment)
   * @returns {Promise<Object>} Created notification
   */
  static async notifyEvaluationComplete(studentId, evaluationType) {
    const typeLabel = this.getEvaluationTypeLabel(evaluationType);
    return await NotificationModel.create({
      user_id: studentId,
      title: 'Evaluation Completed',
      message: `Your ${typeLabel} evaluation has been completed by your instructor. Please check your evaluations for feedback and recommendations.`,
      type: 'evaluation_complete'
    });
  }

  /**
   * Create title submission notification for instructor
   * Notifies instructor that a student has submitted a project title
   * @param {number} instructorId - Instructor ID
   * @param {string} projectTitle - Project title
   * @param {string} studentName - Student name
   * @returns {Promise<Object>} Created notification
   */
  static async notifyTitleSubmission(instructorId, projectTitle, studentName) {
    return await NotificationModel.create({
      user_id: instructorId,
      title: 'New Project Title Submission',
      message: `${studentName} has submitted a new project title: "${projectTitle}". Please review and approve or reject.`,
      type: 'info'
    });
  }

  /**
   * Create title request notification for student
   * Notifies student that instructor has requested title submission
   * @param {number} studentId - Student ID
   * @returns {Promise<Object>} Created notification
   */
  static async notifyTitleRequest(studentId) {
    return await NotificationModel.create({
      user_id: studentId,
      title: 'Project Title Submission Request',
      message: 'Your instructor has requested you to submit your project title. Please submit your project title and description.',
      type: 'info'
    });
  }

  /**
   * Get user notifications
   * Retrieves all notifications for a user, ordered by creation date (newest first)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of notifications
   */
  static async getUserNotifications(userId) {
    return await NotificationModel.findByUser(userId);
  }

  /**
   * Get unread notification count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(userId) {
    const notifications = await NotificationModel.findByUser(userId);
    return notifications.filter(n => !n.is_read).length;
  }

  /**
   * Mark notification as read
   * Updates a single notification's read status
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for verification)
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    const notification = await NotificationModel.markAsRead(notificationId);
    
    // Verify the notification belongs to the user
    if (notification && notification.user_id !== userId) {
      throw new Error('Unauthorized: Notification does not belong to this user');
    }
    
    return notification;
  }

  /**
   * Mark all notifications as read for user
   * Updates all unread notifications for a user to read status
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  static async markAllAsRead(userId) {
    await NotificationModel.markAllAsRead(userId);
  }

  /**
   * Delete notification
   * Removes a notification from the system
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for verification)
   * @returns {Promise<Object>} Deleted notification
   */
  static async deleteNotification(notificationId, userId) {
    const notifications = await NotificationModel.findByUser(userId);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      throw new Error('Notification not found or does not belong to this user');
    }
    
    return await NotificationModel.delete(notificationId);
  }

  /**
   * Helper method to get human-readable evaluation type label
   * @param {string} evaluationType - Evaluation type code
   * @returns {string} Human-readable label
   */
  static getEvaluationTypeLabel(evaluationType) {
    const labels = {
      'proposal': 'Proposal',
      'project_progress': 'Project Progress',
      'final_project': 'Final Project',
      'tutorial_assignment': 'Tutorial Assignment'
    };
    return labels[evaluationType] || evaluationType;
  }
}

export default NotificationService;
