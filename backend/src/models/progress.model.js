/**
 * Progress Model
 */

import pool from '../config/database.js';

class ProgressModel {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM progress WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByStudent(studentId) {
    const result = await pool.query('SELECT * FROM progress WHERE student_id = $1 ORDER BY updated_at DESC', [studentId]);
    return result.rows;
  }

  static async findByCourse(courseId) {
    const result = await pool.query('SELECT * FROM progress WHERE course_id = $1', [courseId]);
    return result.rows;
  }

  static async create(data) {
    const { student_id, course_id, completion_percentage, status } = data;
    const result = await pool.query(
      'INSERT INTO progress (student_id, course_id, completion_percentage, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, course_id, completion_percentage, status]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = Object.keys(data).map((key, i) => `${key} = $${i + 1}`);
    const values = [...Object.values(data), id];
    const result = await pool.query(`UPDATE progress SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM progress WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

export default ProgressModel;
