/**
 * Recommendation Model
 * Handles all recommendation-related database operations
 */

import pool from '../config/database.js';

class RecommendationModel {
  static async findById(recId) {
    const query = 'SELECT * FROM recommendations WHERE id = $1';
    const result = await pool.query(query, [recId]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT r.*, u.full_name as student_name FROM recommendations r LEFT JOIN users u ON r.student_id = u.id ORDER BY r.created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByStudent(studentId) {
    const query = 'SELECT * FROM recommendations WHERE student_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async create(recData) {
    const { student_id, recommendation_text, recommended_by, category } = recData;
    const query = `
      INSERT INTO recommendations (student_id, recommendation_text, recommended_by, category)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [student_id, recommendation_text, recommended_by, category]);
    return result.rows[0];
  }

  static async update(recId, recData) {
    const fields = Object.keys(recData).map((key, i) => `${key} = $${i + 1}`);
    const values = [...Object.values(recData), recId];
    const query = `UPDATE recommendations SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(recId) {
    const query = 'DELETE FROM recommendations WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [recId]);
    return result.rows[0];
  }
}

export default RecommendationModel;
