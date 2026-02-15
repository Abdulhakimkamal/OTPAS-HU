/**
 * Project Service Layer
 * Handles business logic for project title submission and approval workflow
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.6, 4.3
 */

import ProjectModel from '../models/project.model.js';
import NotificationModel from '../models/notification.model.js';
import pool from '../config/database.js';

class ProjectService {
  /**
   * Request title submissions from students
   * Creates a notification for each student to submit their project title
   * @param {number} instructorId - Instructor ID
   * @param {number[]} studentIds - Array of student IDs
   * @returns {Promise<void>}
   */
  static async requestTitleSubmission(instructorId, studentIds) {
    // Verify instructor is assigned to all students
    for (const studentId of studentIds) {
      const isAssigned = await this.verifyInstructorAssignment(instructorId, studentId);
      if (!isAssigned) {
        throw new Error(`Instructor ${instructorId} is not assigned to student ${studentId}`);
      }
    }

    // Create notifications for each student
    const notificationPromises = studentIds.map(studentId =>
      NotificationModel.create({
        user_id: studentId,
        title: 'Project Title Submission Request',
        message: 'Your instructor has requested you to submit your project title. Please submit your project title and description.',
        type: 'info'
      })
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Submit project title
   * Creates a new project with pending status
   * @param {number} studentId - Student ID
   * @param {number} instructorId - Instructor ID
   * @param {string} title - Project title
   * @param {string} description - Project description
   * @returns {Promise<Object>} Created project
   */
  static async submitTitle(studentId, instructorId, title, description) {
    // Verify instructor is assigned to student
    const isAssigned = await this.verifyInstructorAssignment(instructorId, studentId);
    if (!isAssigned) {
      throw new Error(`Instructor ${instructorId} is not assigned to student ${studentId}`);
    }

    // Check for duplicate title
    const existingProject = await ProjectModel.findByStudentAndTitle(studentId, title);
    if (existingProject) {
      throw new Error('A project with this title already exists for this student');
    }

    // Create project with pending status
    const project = await ProjectModel.create({
      student_id: studentId,
      instructor_id: instructorId,
      title,
      description
    });

    // Create notification for instructor
    await NotificationModel.create({
      user_id: instructorId,
      title: 'New Project Title Submission',
      message: `Student has submitted a new project title: "${title}". Please review and approve or reject.`,
      type: 'info'
    });

    return project;
  }

  /**
   * Approve project title
   * Updates project status to approved and creates notification
   * @param {number} projectId - Project ID
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Object>} Updated project
   */
  static async approveTitle(projectId, instructorId) {
    // Get project to verify instructor and get student info
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Verify instructor is assigned to this project
    if (project.instructor_id !== instructorId) {
      throw new Error(`Instructor ${instructorId} is not assigned to this project`);
    }

    // Verify project is in draft status
    if (project.status !== 'draft') {
      throw new Error(`Project ${projectId} is not in draft status. Current status: ${project.status}`);
    }

    // Update project status to approved
    const updatedProject = await ProjectModel.updateStatus(
      projectId,
      'approved',
      new Date()
    );

    // Create notification for student
    await NotificationModel.create({
      user_id: project.student_id,
      title: 'Project Title Approved',
      message: `Your project title "${project.title}" has been approved by your instructor. You can now upload project files.`,
      type: 'title_approved'
    });

    return updatedProject;
  }

  /**
   * Disapprove project title
   * Updates project status to rejected and creates notification
   * @param {number} projectId - Project ID
   * @param {number} instructorId - Instructor ID
   * @param {string} reason - Optional reason for rejection
   * @returns {Promise<Object>} Updated project
   */
  static async disapproveTitle(projectId, instructorId, reason = null) {
    // Get project to verify instructor and get student info
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Verify instructor is assigned to this project
    if (project.instructor_id !== instructorId) {
      throw new Error(`Instructor ${instructorId} is not assigned to this project`);
    }

    // Verify project is in draft status
    if (project.status !== 'draft') {
      throw new Error(`Project ${projectId} is not in draft status. Current status: ${project.status}`);
    }

    // Update project status to rejected
    const updatedProject = await ProjectModel.updateStatus(
      projectId,
      'rejected',
      new Date()
    );

    // Create notification for student with reason if provided
    const message = reason
      ? `Your project title "${project.title}" has been rejected by your instructor. Reason: ${reason}. Please submit a new title.`
      : `Your project title "${project.title}" has been rejected by your instructor. Please submit a new title.`;

    await NotificationModel.create({
      user_id: project.student_id,
      title: 'Project Title Rejected',
      message,
      type: 'title_rejected'
    });

    return updatedProject;
  }

  /**
   * Get project status
   * Returns current project status and approval information
   * @param {number} projectId - Project ID
   * @param {number} studentId - Student ID (for verification)
   * @returns {Promise<Object>} Project status information
   */
  static async getProjectStatus(projectId, studentId) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Verify student owns this project
    if (project.student_id !== studentId) {
      throw new Error(`Student ${studentId} does not own project ${projectId}`);
    }

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      submitted_at: project.submitted_at,
      approved_at: project.approved_at,
      rejected_at: project.rejected_at,
      instructor_name: project.instructor_name,
      instructor_email: project.instructor_email
    };
  }

  /**
   * Verify instructor assignment
   * Checks if instructor is assigned to student
   * @param {number} instructorId - Instructor ID
   * @param {number} studentId - Student ID
   * @returns {Promise<boolean>} True if assigned, false otherwise
   */
  static async verifyInstructorAssignment(instructorId, studentId) {
    const query = `
      SELECT 1 FROM instructor_student_assignments
      WHERE instructor_id = $1 AND student_id = $2 AND is_active = TRUE
      LIMIT 1
    `;

    const result = await pool.query(query, [instructorId, studentId]);
    return result.rows.length > 0;
  }

  /**
   * Get all projects for a student
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Array of projects
   */
  static async getStudentProjects(studentId) {
    return await ProjectModel.findByStudent(studentId);
  }

  /**
   * Get all projects for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Array>} Array of projects
   */
  static async getInstructorProjects(instructorId) {
    return await ProjectModel.findByInstructor(instructorId);
  }

  /**
   * Get pending projects for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Array>} Array of pending projects
   */
  static async getPendingProjects(instructorId) {
    return await ProjectModel.findPendingByInstructor(instructorId);
  }
}

export default ProjectService;
