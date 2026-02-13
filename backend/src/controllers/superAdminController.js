import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

// Create Admin (Super-Admin only)
export const createAdmin = async (req, res) => {
  try {
    const { email, password, full_name, username, department_id } = req.body;

    // Verify requester is super-admin
    if (req.user.role !== 'super_admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only Super-Admin can create admin accounts'
      });
    }

    // Validate input
    if (!email || !password || !full_name || !username) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email, password, full name, and username are required'
      });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Get admin role_id
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['admin']
    );

    if (roleResult.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Admin role not found'
      });
    }

    const role_id = roleResult.rows[0].id;

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, username, role_id, department_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, full_name, username, role_id, department_id, created_at`,
      [email, password_hash, full_name, username, role_id, department_id]
    );

    const admin = result.rows[0];

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Admin account created successfully',
      admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get all admins (Super-Admin only)
export const getAllAdmins = async (req, res) => {
  try {
    // Verify requester is super-admin
    if (req.user.role !== 'super_admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only Super-Admin can view admin accounts'
      });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.department_id, u.is_active, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'admin'
       ORDER BY u.created_at DESC`
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      admins: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Delete admin (Super-Admin only)
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Verify requester is super-admin
    if (req.user.role !== 'super_admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only Super-Admin can delete admin accounts'
      });
    }

    // Check if admin exists
    const adminResult = await pool.query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND r.name = 'admin'`,
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Delete admin
    await pool.query('DELETE FROM users WHERE id = $1', [adminId]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Admin account deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get system statistics (Super-Admin only)
export const getSystemStats = async (req, res) => {
  try {
    // Verify requester is super-admin
    if (req.user.role !== 'super_admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only Super-Admin can view system statistics'
      });
    }

    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1', ['admin']),
      pool.query('SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1', ['student']),
      pool.query('SELECT COUNT(*) as count FROM departments'),
      pool.query('SELECT COUNT(*) as count FROM courses')
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalUsers: parseInt(stats[0].rows[0].count),
        totalAdmins: parseInt(stats[1].rows[0].count),
        totalStudents: parseInt(stats[2].rows[0].count),
        totalDepartments: parseInt(stats[3].rows[0].count),
        totalCourses: parseInt(stats[4].rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};
