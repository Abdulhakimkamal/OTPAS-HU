/**
 * Role Model
 * Handles all role-related database operations
 */

import pool from '../config/database.js';

class RoleModel {
  /**
   * Find role by ID
   */
  static async findById(roleId) {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await pool.query(query, [roleId]);
    return result.rows[0];
  }

  /**
   * Find role by name
   */
  static async findByName(roleName) {
    const query = 'SELECT * FROM roles WHERE name = $1';
    const result = await pool.query(query, [roleName]);
    return result.rows[0];
  }

  /**
   * Get all roles
   */
  static async findAll() {
    const query = 'SELECT * FROM roles ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Create new role
   */
  static async create(roleData) {
    const { name, description, permissions } = roleData;
    const query = `
      INSERT INTO roles (name, description, permissions)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, permissions]);
    return result.rows[0];
  }

  /**
   * Update role
   */
  static async update(roleId, roleData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(roleData).forEach(key => {
      if (roleData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(roleData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(roleId);
    const query = `
      UPDATE roles 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete role
   */
  static async delete(roleId) {
    const query = 'DELETE FROM roles WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [roleId]);
    return result.rows[0];
  }

  /**
   * Get users count by role
   */
  static async getUserCount(roleId) {
    const query = 'SELECT COUNT(*) as count FROM users WHERE role_id = $1';
    const result = await pool.query(query, [roleId]);
    return parseInt(result.rows[0].count);
  }
}

export default RoleModel;
