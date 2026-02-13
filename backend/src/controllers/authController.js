import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Super-Admin authentication
export const superAdminLogin = async (req, res) => {
  try {
    const { emailOrUsername, username, password } = req.body;
    
    // Accept either emailOrUsername or username
    const loginUsername = emailOrUsername || username;

    // Validate input
    if (!loginUsername || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check if credentials match
    // For now, use simple comparison (in production, use bcrypt with stored hash)
    const superAdminUsername = 'superadmin';
    const superAdminPassword = 'superadmin123';

    if (loginUsername !== superAdminUsername || password !== superAdminPassword) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get the actual super admin user from database
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1 AND r.name = 'super_admin'`,
      [superAdminUsername]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Super admin user not found in database'
      });
    }

    const superAdminUser = {
      id: result.rows[0].id, // Use actual database ID (integer)
      username: result.rows[0].username,
      email: result.rows[0].email,
      full_name: result.rows[0].full_name,
      role: result.rows[0].role
    };

    const token = generateToken(superAdminUser);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Super-Admin login successful',
      token,
      user: superAdminUser
    });
  } catch (error) {
    console.error('Super-Admin login error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, full_name, username, role, department_id } = req.body;

    // Reject student registration - students can only be created by department heads
    if (role === 'student') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Students cannot self-register. Only Department Heads can create student accounts.'
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

    // Get role_id from roles table
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role || 'instructor']
    );

    if (roleResult.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const role_id = roleResult.rows[0].id;

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, username, role_id, department_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, full_name, username, role_id, department_id`,
      [email, password_hash, full_name, username, role_id, department_id]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate input
    if (!emailOrUsername || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email/Username and password are required'
      });
    }

    // Find user by email or username
    const result = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 OR u.username = $1`,
      [emailOrUsername]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Account is locked. Please try again later.'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [failedAttempts, lockedUntil, user.id]
      );

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Check if user must change password
    const mustChangePassword = user.must_change_password === true;

    // Create token with role_name
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role_name,
      department_id: user.department_id
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      token,
      mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        department_id: user.department_id,
        must_change_password: mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    let userId = req.user.id;

    console.log('=== GET PROFILE REQUEST ===');
    console.log('User ID:', userId);

    // Handle legacy string ID case (super-admin-1)
    if (userId === 'super-admin-1') {
      // Get the actual super admin user ID from database
      const superAdminResult = await pool.query(
        `SELECT u.id FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.username = 'superadmin' AND r.name = 'super_admin'`
      );
      
      if (superAdminResult.rows.length > 0) {
        userId = superAdminResult.rows[0].id;
        console.log('Converted legacy super-admin-1 to actual ID:', userId);
      } else {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Super admin user not found in database'
        });
      }
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.phone, u.bio, 
              r.name as role, u.department_id, u.created_at, u.last_login
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    console.log('✅ Profile retrieved successfully');
    console.log('User data:', JSON.stringify(result.rows[0], null, 2));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, phone, bio } = req.body;

    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('User ID:', userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Check if email is already taken by another user
    if (email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailExists.rows.length > 0) {
        console.log('❌ Email already in use');
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           bio = COALESCE($4, bio),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, username, full_name, phone, bio, created_at`,
      [full_name, email, phone, bio, userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    console.log('✅ Profile updated successfully');
    console.log('Updated user:', JSON.stringify(result.rows[0], null, 2));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    let userId = req.user.id;
    
    // Handle legacy string ID case (super-admin-1)
    if (userId === 'super-admin-1') {
      // Get the actual super admin user ID from database
      const superAdminResult = await pool.query(
        `SELECT u.id FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.username = 'superadmin' AND r.name = 'super_admin'`
      );
      
      if (superAdminResult.rows.length > 0) {
        userId = superAdminResult.rows[0].id;
      } else {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Super admin user not found in database'
        });
      }
    }
    
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Get user
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await comparePassword(newPassword, userResult.rows[0].password_hash);
    if (isSamePassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};
