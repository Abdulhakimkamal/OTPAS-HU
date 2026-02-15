/**
 * Project Model
 * Handles all project-related database operations
 * Requirements: 1.2, 1.3, 1.4, 1.7, 5.1, 10.7
 */

import pool from '../config/database.js';

class ProjectModel {
  /**
   * Create new project with title submission
   * @param {Object} projectData - Project data
   * @param {number} projectData.student_id - Student ID
   * @param {number} projectData.instructor_id - Instructor ID
   * @param {string} projectData.title - Project title
   * @param {string} projectData.description - Project description
   * @returns {Promise<Object>} Created project
   */
  static async create(projectData) {
    const { student_id, instructor_id, title, description } = projectData;
    
    const query = `
      INSERT INTO projects (student_id, instructor_id, title, description, status, submitted_at)
      VALUES ($1, $2, $3, $4, 'draft', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [student_id, instructor_id, title, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Object|null>} Project or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT p.*, 
             s.full_name as student_name, 
             s.email as student_email,
             i.full_name as instructor_name,
             i.email as instructor_email
      FROM projects p
      LEFT JOIN users s ON p.student_id = s.id
      LEFT JOIN users i ON p.instructor_id = i.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all projects for a student
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Array of projects
   */
  static async findByStudent(studentId) {
    const query = `
      SELECT p.*, 
             i.full_name as instructor_name,
             i.email as instructor_email
      FROM projects p
      LEFT JOIN users i ON p.instructor_id = i.id
      WHERE p.student_id = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Find all projects for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Array>} Array of projects
   */
  static async findByInstructor(instructorId) {
    const query = `
      SELECT p.*, 
             s.full_name as student_name,
             s.email as student_email
      FROM projects p
      LEFT JOIN users s ON p.student_id = s.id
      WHERE p.instructor_id = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }

  /**
   * Find pending projects for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Array>} Array of pending projects
   */
  static async findPendingByInstructor(instructorId) {
    const query = `
      SELECT p.*, 
             s.full_name as student_name,
             s.email as student_email,
             EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.submitted_at)) as days_pending
      FROM projects p
      LEFT JOIN users s ON p.student_id = s.id
      WHERE p.instructor_id = $1 AND p.status = 'submitted'
      ORDER BY p.submitted_at ASC
    `;
    
    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }

  /**
   * Update project status (approve/reject)
   * @param {number} id - Project ID
   * @param {string} status - New status ('approved' or 'rejected')
   * @param {Date} timestamp - Timestamp for approval/rejection
   * @returns {Promise<Object>} Updated project
   */
  static async updateStatus(id, status, timestamp) {
    let query;
    
    if (status === 'approved') {
      query = `
        UPDATE projects 
        SET status = $1, approved_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
    } else if (status === 'rejected') {
      query = `
        UPDATE projects 
        SET status = $1, rejected_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
    } else {
      throw new Error(`Invalid status: ${status}. Must be 'approved' or 'rejected'`);
    }
    
    const values = [status, timestamp, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete project
   * @param {number} id - Project ID
   * @returns {Promise<Object>} Deleted project
   */
  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find project by student and title (for duplicate checking)
   * @param {number} studentId - Student ID
   * @param {string} title - Project title
   * @returns {Promise<Object|null>} Project or null if not found
   */
  static async findByStudentAndTitle(studentId, title) {
    const query = `
      SELECT * FROM projects 
      WHERE student_id = $1 AND title = $2
    `;
    
    const result = await pool.query(query, [studentId, title]);
    return result.rows[0] || null;
  }

  /**
   * Count projects by status for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Object>} Count by status
   */
  static async countByStatus(instructorId) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM projects
      WHERE instructor_id = $1
      GROUP BY status
    `;
    
    const result = await pool.query(query, [instructorId]);
    
    // Convert array to object for easier access
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    result.rows.forEach(row => {
      counts[row.status] = parseInt(row.count);
    });
    
    return counts;
  }

  /**
   * Get project overview for department head
   * @param {number} departmentId - Department ID (optional)
   * @returns {Promise<Array>} Array of project summaries
   */
  static async getProjectOverview(departmentId = null) {
    let query = `
      SELECT 
        p.id,
        p.title,
        p.status,
        p.submitted_at,
        p.approved_at,
        p.rejected_at,
        s.full_name as student_name,
        s.email as student_email,
        s.department_id,
        d.name as department_name,
        i.full_name as instructor_name,
        COUNT(DISTINCT e.id) as evaluation_count,
        AVG(e.score) as average_score
      FROM projects p
      JOIN users s ON p.student_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN users i ON p.instructor_id = i.id
      LEFT JOIN evaluations e ON p.id = e.project_id
    `;
    
    const values = [];
    if (departmentId) {
      query += ' WHERE s.department_id = $1';
      values.push(departmentId);
    }
    
    query += `
      GROUP BY p.id, p.title, p.status, p.submitted_at, p.approved_at, p.rejected_at,
               s.full_name, s.email, s.department_id, d.name, i.full_name
      ORDER BY p.submitted_at DESC
    `;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Verify instructor is assigned to student
   * @param {number} instructorId - Instructor ID
   * @param {number} studentId - Student ID
   * @returns {Promise<boolean>} True if assigned, false otherwise
   */
  static async verifyInstructorAssignment(instructorId, studentId) {
    const query = `
      SELECT 1 FROM instructor_student_assignments
      WHERE instructor_id = $1 AND student_id = $2
      LIMIT 1
    `;
    
    const result = await pool.query(query, [instructorId, studentId]);
    return result.rows.length > 0;
  }
}

export default ProjectModel;
