/**
 * Feedback Model
 */

import pool from '../config/database.js';

class FeedbackModel {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM feedback WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
    return result.rows;
  }

  static async findByUser(userId) {
    const result = await pool.query('SELECT * FROM feedback WHERE user_id = $1', [userId]);
    return result.rows;
  }

  static async create(data) {
    const { user_id, feedback_text, category, rating } = data;
    const result = await pool.query(
      'INSERT INTO feedback (user_id, feedback_text, category, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, feedback_text, category, rating]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = Object.keys(data).map((key, i) => `${key} = $${i + 1}`);
    const values = [...Object.values(data), id];
    const result = await pool.query(`UPDATE feedback SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM feedback WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

export default FeedbackModel;
