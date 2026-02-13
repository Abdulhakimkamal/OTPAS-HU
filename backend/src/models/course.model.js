/**
 * Course Model
 * Handles all course-related database operations
 */

import pool from '../config/database.js';

class CourseModel {
  static async findById(courseId) {
    const query = 'SELECT * FROM courses WHERE id = $1';
    const result = await pool.query(query, [courseId]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT c.*, d.name as department_name FROM courses c LEFT JOIN departments d ON c.department_id = d.id ORDER BY c.name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByDepartment(departmentId) {
    const query = 'SELECT * FROM courses WHERE department_id = $1 ORDER BY name';
    const result = await pool.query(query, [departmentId]);
    return result.rows;
  }

  static async create(courseData) {
    const { name, code, description, credits, department_id, instructor_id } = courseData;
    const query = `
      INSERT INTO courses (name, code, description, credits, department_id, instructor_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [name, code, description, credits, department_id, instructor_id]);
    return result.rows[0];
  }

  static async update(courseId, courseData) {
    const fields = Object.keys(courseData).map((key, i) => `${key} = $${i + 1}`);
    const values = [...Object.values(courseData), courseId];
    const query = `UPDATE courses SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(courseId) {
    const query = 'DELETE FROM courses WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [courseId]);
    return result.rows[0];
  }
}

export default CourseModel;
