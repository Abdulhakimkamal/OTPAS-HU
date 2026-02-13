/**
 * Department Model
 * Handles all department-related database operations
 */

import pool from '../config/database.js';

class DepartmentModel {
  /**
   * Find department by ID
   */
  static async findById(deptId) {
    const query = 'SELECT * FROM departments WHERE id = $1';
    const result = await pool.query(query, [deptId]);
    return result.rows[0];
  }

  /**
   * Find department by code
   */
  static async findByCode(code) {
    const query = 'SELECT * FROM departments WHERE code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  /**
   * Get all departments
   */
  static async findAll() {
    const query = 'SELECT * FROM departments ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Create new department
   */
  static async create(deptData) {
    const { name, code, description, contact_email, phone, location } = deptData;
    const query = `
      INSERT INTO departments (name, code, description, contact_email, phone, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, code, description || null, contact_email || null, phone || null, location || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update department
   */
  static async update(deptId, deptData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(deptData).forEach(key => {
      if (deptData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(deptData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(deptId);
    const query = `
      UPDATE departments 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete department
   */
  static async delete(deptId) {
    const query = 'DELETE FROM departments WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [deptId]);
    return result.rows[0];
  }

  /**
   * Get department statistics
   */
  static async getStats(deptId) {
    const query = `
      SELECT 
        d.*,
        COUNT(DISTINCT CASE WHEN r.name = 'student' THEN u.id END) as student_count,
        COUNT(DISTINCT CASE WHEN r.name = 'instructor' THEN u.id END) as instructor_count,
        COUNT(DISTINCT c.id) as course_count
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN courses c ON d.id = c.department_id
      WHERE d.id = $1
      GROUP BY d.id
    `;
    const result = await pool.query(query, [deptId]);
    return result.rows[0];
  }

  /**
   * Get all departments with statistics
   */
  static async findAllWithStats() {
    const query = `
      SELECT 
        d.*,
        COUNT(DISTINCT CASE WHEN r.name = 'student' THEN u.id END) as student_count,
        COUNT(DISTINCT CASE WHEN r.name = 'instructor' THEN u.id END) as instructor_count,
        COUNT(DISTINCT c.id) as course_count
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN courses c ON d.id = c.department_id
      GROUP BY d.id
      ORDER BY d.name
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default DepartmentModel;
