/**
 * User Model
 * Handles all user-related database operations
 */

import pool from '../config/database.js';

class UserModel {
  /**
   * Find user by ID
   */
  static async findById(userId) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  /**
   * Get all users with pagination
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Get users by role
   */
  static async findByRole(roleName) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE r.name = $1
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query, [roleName]);
    return result.rows;
  }

  /**
   * Get users by department
   */
  static async findByDepartment(departmentId) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.department_id = $1
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query, [departmentId]);
    return result.rows;
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { full_name, email, username, password_hash, role_id, department_id, created_by_admin_id } = userData;
    
    const query = `
      INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, created_by_admin_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `;
    
    const values = [full_name, email, username, password_hash, role_id, department_id || null, created_by_admin_id || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(userId, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   */
  static async delete(userId) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Hard delete user (permanent)
   */
  static async hardDelete(userId) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPasswordHash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newPasswordHash, userId]);
    return result.rows[0];
  }

  /**
   * Count total users
   */
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }

  /**
   * Search users
   */
  static async search(searchTerm) {
    const query = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.is_active = true
      AND (
        u.full_name ILIKE $1 OR
        u.email ILIKE $1 OR
        u.username ILIKE $1
      )
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

export default UserModel;
