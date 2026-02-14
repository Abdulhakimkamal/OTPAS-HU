/**
 * Department Head Service
 * Handles business logic for department head monitoring and read-only access
 * Requirements: 2.9, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import pool from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class DepartmentHeadService {
  /**
   * Get evaluation summary for department head
   * Returns aggregated evaluation data with statistics
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Array of evaluation summaries
   */
  static async getEvaluationSummary(departmentHeadId) {
    const query = `
      SELECT 
        e.id as evaluation_id,
        e.project_id,
        p.title as project_title,
        p.student_id,
        u.full_name as student_name,
        u.email as student_email,
        i.full_name as instructor_name,
        i.email as instructor_email,
        e.evaluation_type,
        e.score,
        e.status as evaluation_status,
        e.feedback,
        e.recommendation,
        e.created_at as evaluated_at,
        COUNT(*) OVER (PARTITION BY e.project_id) as total_evaluations_for_project,
        AVG(e.score) OVER (PARTITION BY e.project_id) as average_score_for_project
      FROM evaluations e
      JOIN projects p ON e.project_id = p.id
      JOIN users u ON p.student_id = u.id
      JOIN users i ON e.instructor_id = i.id
      WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
      ORDER BY e.created_at DESC
    `;

    const result = await pool.query(query, [departmentHeadId]);
    return result.rows;
  }

  /**
   * Get project overview for department head
   * Returns project status information with statistics
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Array of project overviews
   */
  static async getProjectOverview(departmentHeadId) {
    const query = `
      SELECT 
        p.id as project_id,
        p.student_id,
        u.full_name as student_name,
        u.email as student_email,
        i.full_name as instructor_name,
        i.email as instructor_email,
        p.title,
        p.description,
        p.status,
        p.submitted_at,
        p.approved_at,
        p.rejected_at,
        COUNT(DISTINCT e.id) as evaluation_count,
        AVG(e.score) as average_score,
        COUNT(DISTINCT pf.id) as file_count,
        SUM(pf.file_size) as total_file_size,
        MAX(pf.uploaded_at) as last_file_upload
      FROM projects p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN users i ON p.instructor_id = i.id
      LEFT JOIN evaluations e ON p.id = e.project_id
      LEFT JOIN project_files pf ON p.id = pf.project_id
      WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
      GROUP BY p.id, p.student_id, u.full_name, u.email, i.full_name, i.email,
               p.title, p.description, p.status, p.submitted_at, p.approved_at, p.rejected_at
      ORDER BY p.submitted_at DESC
    `;

    const result = await pool.query(query, [departmentHeadId]);
    return result.rows;
  }

  /**
   * Get evaluation statistics for department
   * Returns aggregated statistics for all evaluations in department
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Object>} Evaluation statistics
   */
  static async getEvaluationStatistics(departmentHeadId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT e.id) as total_evaluations,
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(DISTINCT p.student_id) as total_students,
          COUNT(DISTINCT e.instructor_id) as total_instructors,
          AVG(e.score) as average_score,
          MIN(e.score) as min_score,
          MAX(e.score) as max_score,
          COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_projects,
          COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_projects,
          COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_projects
        FROM evaluations e
        JOIN projects p ON e.project_id = p.id
        JOIN users u ON p.student_id = u.id
        WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
      `;

      const result = await pool.query(query, [departmentHeadId]);
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error in getEvaluationStatistics:', error.message);
      // Return empty stats if query fails
      return {
        total_evaluations: 0,
        total_projects: 0,
        total_students: 0,
        total_instructors: 0,
        average_score: 0,
        min_score: 0,
        max_score: 0,
        pending_projects: 0,
        approved_projects: 0,
        rejected_projects: 0
      };
    }
  }

  /**
   * Get evaluation statistics by type
   * Returns statistics grouped by evaluation type
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Statistics by evaluation type
   */
  static async getEvaluationStatisticsByType(departmentHeadId) {
    try {
      // Try to get evaluation_type stats if the column exists
      const query = `
        SELECT 
          COALESCE(e.evaluation_type, 'general') as evaluation_type,
          COUNT(*) as count,
          AVG(e.score) as average_score,
          MIN(e.score) as min_score,
          MAX(e.score) as max_score
        FROM evaluations e
        JOIN projects p ON e.project_id = p.id
        JOIN users u ON p.student_id = u.id
        WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
        GROUP BY COALESCE(e.evaluation_type, 'general')
        ORDER BY COALESCE(e.evaluation_type, 'general')
      `;

      const result = await pool.query(query, [departmentHeadId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getEvaluationStatisticsByType:', error.message);
      // Return empty array if query fails
      return [];
    }
  }

  /**
   * Get project statistics by status
   * Returns statistics grouped by project status
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Statistics by project status
   */
  static async getProjectStatisticsByStatus(departmentHeadId) {
    const query = `
      SELECT 
        p.status,
        COUNT(*) as count,
        COUNT(DISTINCT p.student_id) as student_count,
        COUNT(DISTINCT e.id) as evaluation_count,
        AVG(e.score) as average_score
      FROM projects p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN evaluations e ON p.id = e.project_id
      WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
      GROUP BY p.status
      ORDER BY p.status
    `;

    const result = await pool.query(query, [departmentHeadId]);
    return result.rows;
  }

  /**
   * Get instructor performance summary
   * Returns performance metrics for each instructor
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Instructor performance data
   */
  static async getInstructorPerformance(departmentHeadId) {
    try {
      const query = `
        SELECT 
          i.id as instructor_id,
          i.full_name as instructor_name,
          i.email as instructor_email,
          COUNT(DISTINCT p.id) as assigned_students,
          COUNT(DISTINCT e.id) as evaluations_completed,
          AVG(e.score) as average_evaluation_score,
          COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_projects,
          COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_projects
        FROM users i
        LEFT JOIN instructor_student_assignments isa ON i.id = isa.instructor_id
        LEFT JOIN users s ON isa.student_id = s.id
        LEFT JOIN projects p ON i.id = p.instructor_id AND s.id = p.student_id
        LEFT JOIN evaluations e ON p.id = e.project_id
        WHERE s.department_id = (SELECT department_id FROM users WHERE id = $1)
        GROUP BY i.id, i.full_name, i.email
        ORDER BY evaluations_completed DESC
      `;

      const result = await pool.query(query, [departmentHeadId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getInstructorPerformance:', error.message);
      return [];
    }
  }

  /**
   * Get student progress summary
   * Returns progress information for each student
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} Student progress data
   */
  static async getStudentProgress(departmentHeadId) {
    const query = `
      SELECT 
        u.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_projects,
        COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_projects,
        COUNT(DISTINCT e.id) as evaluations_received,
        AVG(e.score) as average_score,
        COUNT(DISTINCT pf.id) as files_uploaded,
        SUM(pf.file_size) as total_file_size
      FROM users u
      LEFT JOIN projects p ON u.id = p.student_id
      LEFT JOIN evaluations e ON p.id = e.project_id
      LEFT JOIN project_files pf ON p.id = pf.project_id
      WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
      GROUP BY u.id, u.full_name, u.email
      ORDER BY u.full_name
    `;

    const result = await pool.query(query, [departmentHeadId]);
    return result.rows;
  }

  /**
   * Get recent activity
   * Returns recent evaluations and project updates
   * @param {number} departmentHeadId - Department head ID
   * @param {number} limit - Number of records to return (default: 20)
   * @returns {Promise<Array>} Recent activity
   */
  static async getRecentActivity(departmentHeadId, limit = 20) {
    try {
      const query = `
        SELECT 
          'evaluation' as activity_type,
          e.id as activity_id,
          e.created_at as activity_date,
          u.full_name as student_name,
          i.full_name as instructor_name,
          p.title as project_title,
          COALESCE(e.evaluation_type, 'general') as details,
          e.score as score
        FROM evaluations e
        JOIN projects p ON e.project_id = p.id
        JOIN users u ON p.student_id = u.id
        JOIN users i ON e.instructor_id = i.id
        WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
        
        UNION ALL
        
        SELECT 
          'project_status_change' as activity_type,
          p.id as activity_id,
          COALESCE(p.approved_at, p.rejected_at, p.submitted_at) as activity_date,
          u.full_name as student_name,
          i.full_name as instructor_name,
          p.title as project_title,
          p.status as details,
          NULL as score
        FROM projects p
        JOIN users u ON p.student_id = u.id
        LEFT JOIN users i ON p.instructor_id = i.id
        WHERE u.department_id = (SELECT department_id FROM users WHERE id = $1)
        
        ORDER BY activity_date DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [departmentHeadId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error in getRecentActivity:', error.message);
      return [];
    }
  }

  /**
   * Verify department head belongs to department
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<number>} Department ID
   */
  static async getDepartmentId(departmentHeadId) {
    const query = `
      SELECT department_id FROM users WHERE id = $1 AND role = 'department_head'
    `;

    const result = await pool.query(query, [departmentHeadId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Department head not found', { departmentHeadId });
    }

    return result.rows[0].department_id;
  }
}

export default DepartmentHeadService;
