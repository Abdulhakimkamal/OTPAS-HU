/**
 * Instructor Recommendation Model
 * Handles all instructor recommendation-related database operations
 */

import pool from '../config/database.js';

class InstructorRecommendationModel {
  static async findById(id) {
    const query = `
      SELECT 
        ir.*,
        s.full_name as student_name,
        s.email as student_email,
        i.full_name as instructor_name,
        c.title as course_title,
        c.code as course_code
      FROM instructor_recommendations ir
      LEFT JOIN users s ON ir.student_id = s.id
      LEFT JOIN users i ON ir.instructor_id = i.id
      LEFT JOIN course_evaluations ce ON ir.evaluation_id = ce.id
      LEFT JOIN courses c ON ce.course_id = c.id
      WHERE ir.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByInstructor(instructorId, filters = {}) {
    let query = `
      SELECT 
        ir.*,
        s.full_name as student_name,
        s.email as student_email,
        c.title as course_title,
        c.code as course_code
      FROM instructor_recommendations ir
      LEFT JOIN users s ON ir.student_id = s.id
      LEFT JOIN course_evaluations ce ON ir.evaluation_id = ce.id
      LEFT JOIN courses c ON ce.course_id = c.id
      WHERE ir.instructor_id = $1
    `;
    
    const params = [instructorId];
    let paramCount = 1;

    if (filters.student_id) {
      paramCount++;
      query += ` AND ir.student_id = $${paramCount}`;
      params.push(filters.student_id);
    }

    if (filters.recommendation_type) {
      paramCount++;
      query += ` AND ir.recommendation_type = $${paramCount}`;
      params.push(filters.recommendation_type);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND ir.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.priority_level) {
      paramCount++;
      query += ` AND ir.priority_level = $${paramCount}`;
      params.push(filters.priority_level);
    }

    query += ' ORDER BY ir.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByStudent(studentId) {
    const query = `
      SELECT 
        ir.*,
        i.full_name as instructor_name,
        i.email as instructor_email,
        c.title as course_title,
        c.code as course_code
      FROM instructor_recommendations ir
      LEFT JOIN users i ON ir.instructor_id = i.id
      LEFT JOIN course_evaluations ce ON ir.evaluation_id = ce.id
      LEFT JOIN courses c ON ce.course_id = c.id
      WHERE ir.student_id = $1
      ORDER BY ir.created_at DESC
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async create(recommendationData) {
    const {
      instructor_id,
      student_id,
      evaluation_id,
      recommendation_type,
      title,
      description,
      priority_level,
      status
    } = recommendationData;

    const query = `
      INSERT INTO instructor_recommendations (
        instructor_id, student_id, evaluation_id, recommendation_type,
        title, description, priority_level, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      instructor_id,
      student_id,
      evaluation_id || null,
      recommendation_type,
      title,
      description,
      priority_level || 'Medium',
      status || 'Draft'
    ]);

    return result.rows[0];
  }

  static async update(id, instructorId, updateData) {
    const allowedFields = ['title', 'description', 'recommendation_type', 'priority_level', 'status'];
    const updates = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(id);
    paramCount++;
    values.push(instructorId);

    const query = `
      UPDATE instructor_recommendations 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount - 1} AND instructor_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, instructorId) {
    const query = `
      DELETE FROM instructor_recommendations 
      WHERE id = $1 AND instructor_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, instructorId]);
    return result.rows[0];
  }

  static async markAsRead(id, studentId) {
    const query = `
      UPDATE instructor_recommendations 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND student_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, studentId]);
    return result.rows[0];
  }

  static async getStatistics(instructorId) {
    const query = `
      SELECT 
        COUNT(*) as total_recommendations,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN status = 'Reviewed' THEN 1 END) as reviewed_count,
        COUNT(CASE WHEN priority_level = 'High' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM instructor_recommendations
      WHERE instructor_id = $1
    `;
    const result = await pool.query(query, [instructorId]);
    return result.rows[0];
  }

  static async verifyInstructorAccess(instructorId, studentId) {
    // First try to check instructor_student_assignments table
    let query = `
      SELECT COUNT(*) as count
      FROM instructor_student_assignments isa
      WHERE isa.instructor_id = $1 AND isa.student_id = $2 AND isa.is_active = true
    `;
    
    try {
      const result = await pool.query(query, [instructorId, studentId]);
      if (parseInt(result.rows[0].count) > 0) {
        return true;
      }
    } catch (error) {
      console.log('instructor_student_assignments table not available, falling back to course enrollments');
    }
    
    // Fallback to course enrollments
    const fallbackQuery = `
      SELECT COUNT(*) as count
      FROM courses c
      INNER JOIN enrollments e ON e.course_id = c.id
      WHERE c.instructor_id = $1 AND e.student_id = $2
    `;
    const fallbackResult = await pool.query(fallbackQuery, [instructorId, studentId]);
    return parseInt(fallbackResult.rows[0].count) > 0;
  }
}

export default InstructorRecommendationModel;