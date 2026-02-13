/**
 * Evaluation Model
 * Handles all evaluation-related database operations
 * Requirements: 2.1, 2.8, 2.9, 9.1, 10.7
 */

import pool from '../config/database.js';

class EvaluationModel {
  /**
   * Create new evaluation
   * @param {Object} evaluationData - Evaluation data
   * @param {number} evaluationData.project_id - Project ID
   * @param {number} evaluationData.instructor_id - Instructor ID
   * @param {string} evaluationData.evaluation_type - Evaluation type (proposal, project_progress, final_project, tutorial_assignment)
   * @param {number} evaluationData.score - Score (0-100)
   * @param {string} evaluationData.feedback - Feedback text (minimum 10 characters)
   * @param {string} evaluationData.recommendation - Recommendation text
   * @param {string} evaluationData.status - Evaluation status (Approved, Needs Revision, Rejected)
   * @returns {Promise<Object>} Created evaluation
   */
  static async create(evaluationData) {
    const { 
      project_id, 
      instructor_id, 
      evaluation_type, 
      score, 
      feedback, 
      recommendation, 
      status 
    } = evaluationData;
    
    // First, get the student_id from the project
    const projectQuery = 'SELECT student_id FROM projects WHERE id = $1';
    const projectResult = await pool.query(projectQuery, [project_id]);
    
    if (projectResult.rows.length === 0) {
      throw new Error(`Project with id ${project_id} not found`);
    }
    
    const student_id = projectResult.rows[0].student_id;
    
    const query = `
      INSERT INTO evaluations (
        project_id, 
        student_id,
        instructor_id, 
        evaluation_type, 
        score, 
        feedback, 
        recommendation, 
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      project_id,
      student_id,
      instructor_id, 
      evaluation_type, 
      score, 
      feedback, 
      recommendation, 
      status
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find evaluation by ID
   * @param {number} id - Evaluation ID
   * @returns {Promise<Object|null>} Evaluation or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT e.*, 
             p.title as project_title,
             p.student_id,
             s.full_name as student_name,
             s.email as student_email,
             i.full_name as instructor_name,
             i.email as instructor_email
      FROM evaluations e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users s ON p.student_id = s.id
      LEFT JOIN users i ON e.instructor_id = i.id
      WHERE e.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all evaluations for a student
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Array of evaluations
   */
  static async findByStudent(studentId) {
    const query = `
      SELECT e.*, 
             p.title as project_title,
             p.description as project_description,
             i.full_name as instructor_name,
             i.email as instructor_email
      FROM evaluations e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users i ON e.instructor_id = i.id
      WHERE p.student_id = $1
      ORDER BY e.created_at DESC
    `;
    
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Find all evaluations for a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Array of evaluations
   */
  static async findByProject(projectId) {
    const query = `
      SELECT e.*, 
             i.full_name as instructor_name,
             i.email as instructor_email
      FROM evaluations e
      LEFT JOIN users i ON e.instructor_id = i.id
      WHERE e.project_id = $1
      ORDER BY e.created_at DESC
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Find evaluation summary for department head
   * @param {number} departmentId - Department ID (optional)
   * @returns {Promise<Array>} Array of evaluation summaries
   */
  static async findSummary(departmentId = null) {
    let query = `
      SELECT 
        e.id as evaluation_id,
        e.project_id,
        p.title as project_title,
        p.student_id,
        s.full_name as student_name,
        s.email as student_email,
        s.department_id,
        d.name as department_name,
        e.instructor_id,
        i.full_name as instructor_name,
        i.email as instructor_email,
        e.evaluation_type,
        e.score,
        e.status as evaluation_status,
        e.created_at as evaluated_at
      FROM evaluations e
      JOIN projects p ON e.project_id = p.id
      JOIN users s ON p.student_id = s.id
      JOIN users i ON e.instructor_id = i.id
      LEFT JOIN departments d ON s.department_id = d.id
    `;
    
    const values = [];
    if (departmentId) {
      query += ' WHERE s.department_id = $1';
      values.push(departmentId);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update evaluation
   * @param {number} id - Evaluation ID
   * @param {Object} data - Partial evaluation data to update
   * @returns {Promise<Object>} Updated evaluation
   */
  static async update(id, data) {
    // Build dynamic update query based on provided fields
    const allowedFields = [
      'evaluation_type', 
      'score', 
      'feedback', 
      'recommendation', 
      'status'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add id as the last parameter
    values.push(id);
    
    const query = `
      UPDATE evaluations 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete evaluation
   * @param {number} id - Evaluation ID
   * @returns {Promise<Object>} Deleted evaluation
   */
  static async delete(id) {
    const query = 'DELETE FROM evaluations WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get evaluation statistics for an instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Object>} Evaluation statistics
   */
  static async getInstructorStats(instructorId) {
    const query = `
      SELECT 
        COUNT(*) as total_evaluations,
        AVG(score) as average_score,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'Needs Revision' THEN 1 END) as needs_revision_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN evaluation_type = 'proposal' THEN 1 END) as proposal_count,
        COUNT(CASE WHEN evaluation_type = 'project_progress' THEN 1 END) as progress_count,
        COUNT(CASE WHEN evaluation_type = 'final_project' THEN 1 END) as final_count,
        COUNT(CASE WHEN evaluation_type = 'tutorial_assignment' THEN 1 END) as tutorial_count
      FROM evaluations
      WHERE instructor_id = $1
    `;
    
    const result = await pool.query(query, [instructorId]);
    return result.rows[0];
  }

  /**
   * Get evaluation statistics by department
   * @param {number} departmentId - Department ID (optional)
   * @returns {Promise<Array>} Array of evaluation statistics by evaluation type
   */
  static async getDepartmentStats(departmentId = null) {
    let query = `
      SELECT 
        e.evaluation_type,
        COUNT(*) as total_count,
        AVG(e.score) as average_score,
        MIN(e.score) as min_score,
        MAX(e.score) as max_score,
        COUNT(CASE WHEN e.status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN e.status = 'Needs Revision' THEN 1 END) as needs_revision_count,
        COUNT(CASE WHEN e.status = 'Rejected' THEN 1 END) as rejected_count
      FROM evaluations e
      JOIN projects p ON e.project_id = p.id
      JOIN users s ON p.student_id = s.id
    `;
    
    const values = [];
    if (departmentId) {
      query += ' WHERE s.department_id = $1';
      values.push(departmentId);
    }
    
    query += ' GROUP BY e.evaluation_type ORDER BY e.evaluation_type';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Find evaluations by instructor
   * @param {number} instructorId - Instructor ID
   * @returns {Promise<Array>} Array of evaluations
   */
  static async findByInstructor(instructorId) {
    const query = `
      SELECT e.*, 
             p.title as project_title,
             p.student_id,
             s.full_name as student_name,
             s.email as student_email
      FROM evaluations e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users s ON p.student_id = s.id
      WHERE e.instructor_id = $1
      ORDER BY e.created_at DESC
    `;
    
    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }
}

export default EvaluationModel;
