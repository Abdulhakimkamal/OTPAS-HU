import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

// ============================================
// DASHBOARD OVERVIEW
// ============================================

export const getDashboardOverview = async (req, res) => {
  try {
    const [users, students, projects, pending] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'student')"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'approved'"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'submitted'")
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview: {
        totalUsers: parseInt(users.rows[0].count),
        totalStudents: parseInt(students.rows[0].count),
        activeProjects: parseInt(projects.rows[0].count),
        pendingApprovals: parseInt(pending.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAllUsers = async (req, res) => {
  try {
    const { role, department_id, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT u.*, r.name as role_name, d.name as department_name 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 LEFT JOIN departments d ON u.department_id = d.id`;
    const params = [];

    if (role) {
      query += ` WHERE r.name = $${params.length + 1}`;
      params.push(role);
    }

    if (department_id) {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ` u.department_id = $${params.length + 1}`;
      params.push(department_id);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      users: result.rows,
      pagination: { page, limit, total: result.rows.length }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const createInstructor = async (req, res) => {
  try {
    const { full_name, email, username, password, department_id } = req.body;

    // Check if user exists
    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User already exists'
      });
    }

    const password_hash = await hashPassword(password);
    const roleId = await pool.query("SELECT id FROM roles WHERE name = 'instructor'");

    const result = await pool.query(
      `INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, full_name, email, username, role_id, department_id`,
      [full_name, email, username, password_hash, roleId.rows[0].id, department_id]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Instructor created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create instructor error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const createDepartmentHead = async (req, res) => {
  try {
    const { full_name, email, username, password, department_id } = req.body;

    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User already exists'
      });
    }

    const password_hash = await hashPassword(password);
    const roleId = await pool.query("SELECT id FROM roles WHERE name = 'department_head'");

    const result = await pool.query(
      `INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, full_name, email, username, role_id, department_id`,
      [full_name, email, username, password_hash, roleId.rows[0].id, department_id]
    );

    // Update department head
    await pool.query('UPDATE departments SET head_id = $1 WHERE id = $2', [result.rows[0].id, department_id]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Department Head created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create department head error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, department_id, is_active } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, email = $2, department_id = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, full_name, email, role_id, department_id, is_active`,
      [full_name, email, department_id, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const password_hash = await hashPassword(new_password);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email',
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, role, department, status } = req.body;

    // Validate input
    if (!name || !email || !role) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Name, email, and role are required'
      });
    }

    // Check if user exists
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Generate username from email
    let username = email.split('@')[0];
    
    // Check if username exists, if so add a random suffix
    let usernameExists = true;
    let counter = 0;
    while (usernameExists && counter < 10) {
      const checkUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (checkUsername.rows.length === 0) {
        usernameExists = false;
      } else {
        username = `${email.split('@')[0]}${Math.floor(Math.random() * 1000)}`;
        counter++;
      }
    }

    if (usernameExists) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Could not generate unique username'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const password_hash = await hashPassword(tempPassword);

    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Get department ID if provided
    let department_id = null;
    if (department) {
      const deptResult = await pool.query('SELECT id FROM departments WHERE name = $1', [department]);
      if (deptResult.rows.length > 0) {
        department_id = deptResult.rows[0].id;
      }
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, full_name, email, created_at`,
      [name, email, username, password_hash, roleResult.rows[0].id, department_id, status === 'active' || true]
    );

    const user = result.rows[0];

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: role,
        department: department || 'N/A',
        status: status || 'active',
        joinDate: user.created_at.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

export const getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name as head_name 
       FROM departments d 
       LEFT JOIN users u ON d.head_id = u.id 
       ORDER BY d.name`
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      departments: result.rows
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, contact_email, phone, location } = req.body;

    // Check for duplicate name or code
    const existing = await pool.query(
      'SELECT id, name, code FROM departments WHERE LOWER(name) = LOWER($1) OR UPPER(code) = UPPER($2)',
      [name, code]
    );

    if (existing.rows.length > 0) {
      const duplicate = existing.rows[0];
      const errors = [];
      
      if (duplicate.name.toLowerCase() === name.toLowerCase()) {
        errors.push({
          field: 'name',
          message: `Department "${duplicate.name}" already exists`,
          value: name
        });
      }
      
      if (duplicate.code.toUpperCase() === code.toUpperCase()) {
        errors.push({
          field: 'code',
          message: `Department code "${duplicate.code}" is already in use`,
          value: code
        });
      }

      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Department already exists',
        errors
      });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, code, description, contact_email, phone, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, code, description || null, contact_email || null, phone || null, location || null]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Department created successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Create department error:', error);
    
    // Handle PostgreSQL unique constraint violation
    if (error.code === '23505') {
      const field = error.constraint?.includes('name') ? 'name' : 'code';
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Department already exists',
        errors: [{
          field,
          message: `This ${field} is already in use`,
          value: req.body[field]
        }]
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, head_id, contact_email, phone, location } = req.body;

    const result = await pool.query(
      `UPDATE departments 
       SET name = COALESCE($1, name), 
           code = COALESCE($2, code), 
           description = COALESCE($3, description), 
           head_id = COALESCE($4, head_id),
           contact_email = COALESCE($5, contact_email),
           phone = COALESCE($6, phone),
           location = COALESCE($7, location),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, code, description, head_id, contact_email, phone, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Department updated successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// MONITORING & REPORTS
// ============================================

export const getSystemReports = async (req, res) => {
  try {
    const [userStats, deptStats, projectStats, activityStats] = await Promise.all([
      pool.query(`SELECT r.name as role, COUNT(u.id) as count 
                  FROM users u 
                  JOIN roles r ON u.role_id = r.id 
                  GROUP BY r.name`),
      pool.query(`SELECT d.name, COUNT(u.id) as user_count 
                  FROM departments d 
                  LEFT JOIN users u ON d.id = u.department_id 
                  GROUP BY d.id, d.name`),
      pool.query(`SELECT status, COUNT(*) as count FROM projects GROUP BY status`),
      pool.query(`SELECT DATE(created_at) as date, COUNT(*) as count 
                  FROM activity_logs 
                  WHERE created_at >= NOW() - INTERVAL '30 days' 
                  GROUP BY DATE(created_at) 
                  ORDER BY date DESC`)
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      reports: {
        userStats: userStats.rows,
        departmentStats: deptStats.rows,
        projectStats: projectStats.rows,
        activityStats: activityStats.rows
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const { user_id, limit = 50 } = req.query;

    let query = `SELECT lh.*, u.full_name, u.email 
                 FROM login_history lh 
                 JOIN users u ON lh.user_id = u.id`;
    const params = [];

    if (user_id) {
      query += ` WHERE lh.user_id = $1`;
      params.push(user_id);
    }

    query += ` ORDER BY lh.login_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      loginHistory: result.rows
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const { user_id, action, limit = 100 } = req.query;

    let query = `SELECT al.*, u.full_name, u.email 
                 FROM activity_logs al 
                 JOIN users u ON al.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (user_id) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (action) {
      conditions.push(`al.action ILIKE $${params.length + 1}`);
      params.push(`%${action}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      activityLogs: result.rows
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// PROJECT APPROVAL
// ============================================

export const approveProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { feedback } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET status = 'approved', feedback = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [feedback, project_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project approved successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Approve project error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const rejectProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { feedback } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET status = 'rejected', feedback = $1
       WHERE id = $2
       RETURNING *`,
      [feedback, project_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Project rejected',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Reject project error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};


// ============================================
// STUDENT PROGRESS TRACKING
// ============================================

export const getStudentProgress = async (req, res) => {
  try {
    const { student_id, department_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT 
                  u.id, u.full_name, u.email, d.name as department,
                  COUNT(DISTINCT c.id) as courses_enrolled,
                  COUNT(DISTINCT CASE WHEN sp.completion_percentage = 100 THEN c.id END) as courses_completed,
                  ROUND(AVG(sp.completion_percentage), 2) as overall_progress,
                  COUNT(DISTINCT p.id) as projects_submitted,
                  COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as projects_approved,
                  MAX(sp.last_accessed) as last_activity
                 FROM users u
                 LEFT JOIN departments d ON u.department_id = d.id
                 LEFT JOIN student_progress sp ON u.id = sp.student_id
                 LEFT JOIN courses c ON sp.course_id = c.id
                 LEFT JOIN projects p ON u.id = p.student_id
                 WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')`;
    
    const params = [];

    if (student_id) {
      query += ` AND u.id = $${params.length + 1}`;
      params.push(student_id);
    }

    if (department_id) {
      query += ` AND u.department_id = $${params.length + 1}`;
      params.push(department_id);
    }

    query += ` GROUP BY u.id, u.full_name, u.email, d.name
               ORDER BY u.created_at DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      studentProgress: result.rows,
      pagination: { page, limit, total: result.rows.length }
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getStudentDetailedProgress = async (req, res) => {
  try {
    const { student_id } = req.params;

    const [studentData, courseProgress, projectData] = await Promise.all([
      pool.query(`SELECT u.*, d.name as department_name 
                  FROM users u 
                  LEFT JOIN departments d ON u.department_id = d.id 
                  WHERE u.id = $1`, [student_id]),
      pool.query(`SELECT c.id, c.title, sp.completion_percentage, sp.last_accessed
                  FROM student_progress sp
                  JOIN courses c ON sp.course_id = c.id
                  WHERE sp.student_id = $1
                  ORDER BY sp.last_accessed DESC`, [student_id]),
      pool.query(`SELECT id, title, status, submitted_at, updated_at
                  FROM projects
                  WHERE student_id = $1
                  ORDER BY submitted_at DESC`, [student_id])
    ]);

    if (studentData.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      student: studentData.rows[0],
      courseProgress: courseProgress.rows,
      projects: projectData.rows
    });
  } catch (error) {
    console.error('Get student detailed progress error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

export const getRecommendations = async (req, res) => {
  try {
    const { student_id, type, status, limit = 50 } = req.query;

    let query = `SELECT r.*, u.full_name as student_name, u.email as student_email
                 FROM recommendations r
                 JOIN users u ON r.student_id = u.id`;
    const params = [];
    const conditions = [];

    if (student_id) {
      conditions.push(`r.student_id = $${params.length + 1}`);
      params.push(student_id);
    }

    if (type) {
      conditions.push(`r.recommendation_type = $${params.length + 1}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY r.score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      recommendations: result.rows
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const createRecommendation = async (req, res) => {
  try {
    const { student_id, recommendation_type, reference_id, score, reason } = req.body;

    const result = await pool.query(
      `INSERT INTO recommendations (student_id, recommendation_type, reference_id, score, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [student_id, recommendation_type, reference_id, score, reason]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Recommendation created successfully',
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateRecommendationStatus = async (req, res) => {
  try {
    const { recommendation_id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE recommendations 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, recommendation_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recommendation status updated',
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Update recommendation status error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const deleteRecommendation = async (req, res) => {
  try {
    const { recommendation_id } = req.params;

    const result = await pool.query(
      'DELETE FROM recommendations WHERE id = $1 RETURNING id',
      [recommendation_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recommendation deleted successfully'
    });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};


// ============================================
// CREATE USER (Full Stack Implementation)
// ============================================

export const createUserFullStack = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      fullName,
      role,
      department,
      sendWelcomeEmail,
      forcePasswordChange,
      isActive
    } = req.body;

    // Validation
    const errors = {};
    
    if (!username || username.length < 4 || username.length > 20) {
      errors.username = 'Username must be 4-20 characters';
    }
    if (!password || !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
      errors.password = 'Password must have uppercase, lowercase, number, and special character';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!fullName) {
      errors.fullName = 'Full name is required';
    }
    if (!role || !['admin', 'department_head', 'instructor'].includes(role)) {
      errors.role = 'Invalid role';
    }
    // Department is required for department_head and instructor, but optional for admin
    if ((role === 'department_head' || role === 'instructor') && !department) {
      errors.department = 'Department is required for this role';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check username uniqueness
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Username already taken',
        errors: { username: 'Username already taken' }
      });
    }

    // Check email uniqueness
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Email already registered',
        errors: { email: 'Email already registered' }
      });
    }

    // Get role ID
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );
    if (roleResult.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Get department ID
    const deptResult = await pool.query(
      'SELECT id FROM departments WHERE code = $1 OR name = $2',
      [department.toUpperCase(), department]
    );
    let departmentId = null;
    if (deptResult.rows.length > 0) {
      departmentId = deptResult.rows[0].id;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Handle created_by_admin_id - convert to integer or null for super admin
    const createdById = req.user && !isNaN(parseInt(req.user.id)) ? parseInt(req.user.id) : null;

    // Create user
    const result = await pool.query(
      `INSERT INTO users (
        username, email, password_hash, full_name, role_id, 
        department_id, is_active, must_change_password, welcome_email_sent, created_by_admin_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, username, email, full_name, role_id, department_id, is_active, must_change_password, welcome_email_sent, created_at`,
      [
        username,
        email,
        password_hash,
        fullName,
        roleResult.rows[0].id,
        departmentId,
        isActive !== false,
        forcePasswordChange === true,
        sendWelcomeEmail === true,
        createdById
      ]
    );

    const user = result.rows[0];

    // TODO: Implement email sending functionality
    // if (sendWelcomeEmail && user.welcome_email_sent) {
    //   await sendWelcomeEmailToUser(user.email, username, temporaryPassword);
    // }

    // Get role name
    const roleNameResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [user.role_id]
    );

    // Get department name
    let departmentName = 'N/A';
    if (user.department_id) {
      const deptNameResult = await pool.query(
        'SELECT name FROM departments WHERE id = $1',
        [user.department_id]
      );
      if (deptNameResult.rows.length > 0) {
        departmentName = deptNameResult.rows[0].name;
      }
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: roleNameResult.rows[0].name,
        department: departmentName,
        status: user.is_active ? 'active' : 'inactive',
        mustChangePassword: user.must_change_password,
        welcomeEmailSent: user.welcome_email_sent,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Create user full stack error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
};

// ============================================
// CREATE USER (Enhanced)
// ============================================

export const createUserEnhanced = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      fullName,
      role,
      department,
      sendWelcomeEmail,
      forcePasswordChange,
      isActive
    } = req.body;

    // Validation
    if (!username || !password || !email || !fullName || !role) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields',
        errors: {
          username: !username ? 'Username is required' : '',
          password: !password ? 'Password is required' : '',
          email: !email ? 'Email is required' : '',
          fullName: !fullName ? 'Full name is required' : '',
          role: !role ? 'Role is required' : ''
        }
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid username format',
        errors: {
          username: 'Username must be 4-20 characters, alphanumeric and underscores only'
        }
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: {
          password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        }
      });
    }

    // Check if username exists
    const usernameExists = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (usernameExists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Username already taken',
        errors: {
          username: 'Username already taken'
        }
      });
    }

    // Check if email exists
    const emailExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailExists.rows.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Email already registered',
        errors: {
          email: 'Email already registered'
        }
      });
    }

    // Get role ID
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );
    if (roleResult.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Get department ID if provided
    let departmentId = null;
    if (department) {
      const deptResult = await pool.query(
        'SELECT id FROM departments WHERE code = $1 OR name = $2',
        [department.toUpperCase(), department]
      );
      if (deptResult.rows.length > 0) {
        departmentId = deptResult.rows[0].id;
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Handle created_by_admin_id - convert to integer or null for super admin
    const createdById = req.user && !isNaN(parseInt(req.user.id)) ? parseInt(req.user.id) : null;

    // Create user
    const result = await pool.query(
      `INSERT INTO users (
        username, email, password_hash, full_name, role_id, 
        department_id, is_active, must_change_password, created_by_admin_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, username, email, full_name, role_id, department_id, is_active, created_at`,
      [
        username,
        email,
        password_hash,
        fullName,
        roleResult.rows[0].id,
        departmentId,
        isActive !== false,
        forcePasswordChange === true,
        createdById
      ]
    );

    const user = result.rows[0];

    // Get role name and department name for response
    const roleNameResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [user.role_id]
    );

    let departmentName = 'N/A';
    if (user.department_id) {
      const deptNameResult = await pool.query(
        'SELECT name FROM departments WHERE id = $1',
        [user.department_id]
      );
      if (deptNameResult.rows.length > 0) {
        departmentName = deptNameResult.rows[0].name;
      }
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: roleNameResult.rows[0].name,
        department: departmentName,
        status: user.is_active ? 'active' : 'inactive',
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Create user enhanced error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};


// ============================================
// SYSTEM SETTINGS MANAGEMENT
// ============================================

export const getSystemSettings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT setting_key, setting_value, setting_type, description, is_public, updated_at
       FROM system_settings
       ORDER BY setting_key`
    );

    // Convert settings array to object for easier frontend consumption
    const settings = {};
    result.rows.forEach(row => {
      let value = row.setting_value;
      
      // Convert based on type
      if (row.setting_type === 'boolean') {
        value = value === 'true';
      } else if (row.setting_type === 'integer') {
        value = parseInt(value);
      }
      
      settings[row.setting_key] = value;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      settings,
      rawSettings: result.rows // Include raw data for reference
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    console.log('📥 Received settings update request');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const {
      systemName,
      adminEmail,
      maintenanceMode,
      emailNotifications,
      autoBackup,
      backupFrequency,
      maxUploadSize,
      sessionTimeout
    } = req.body;

    const updatedById = req.user && !isNaN(parseInt(req.user.id)) ? parseInt(req.user.id) : null;
    const updates = [];

    // Map frontend fields to database setting keys
    const settingsMap = [
      { key: 'site_name', value: systemName, type: 'string' },
      { key: 'admin_email', value: adminEmail, type: 'string' },
      { key: 'maintenance_mode', value: maintenanceMode, type: 'boolean' },
      { key: 'enable_email_notifications', value: emailNotifications, type: 'boolean' },
      { key: 'auto_backup', value: autoBackup, type: 'boolean' },
      { key: 'backup_frequency', value: backupFrequency, type: 'string' },
      { key: 'max_file_upload_size', value: maxUploadSize ? parseInt(maxUploadSize) * 1024 * 1024 : null, type: 'integer' }, // Convert MB to bytes
      { key: 'session_timeout', value: sessionTimeout ? parseInt(sessionTimeout) * 60 : null, type: 'integer' } // Convert minutes to seconds
    ];

    console.log('Settings to update:', settingsMap);

    // Update each setting
    for (const setting of settingsMap) {
      if (setting.value !== undefined && setting.value !== null) {
        let valueToStore = setting.value;
        
        // Convert to string for storage
        if (setting.type === 'boolean') {
          valueToStore = setting.value ? 'true' : 'false';
        } else if (setting.type === 'integer') {
          valueToStore = setting.value.toString();
        }

        console.log(`Updating ${setting.key} = ${valueToStore}`);

        const result = await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (setting_key) 
           DO UPDATE SET 
             setting_value = EXCLUDED.setting_value,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()
           RETURNING setting_key, setting_value`,
          [setting.key, valueToStore, setting.type, updatedById]
        );

        if (result.rows.length > 0) {
          updates.push(result.rows[0]);
          console.log(`✅ Updated ${setting.key}`);
        }
      }
    }

    console.log('✅ All settings updated successfully');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Settings updated successfully',
      updatedSettings: updates
    });
  } catch (error) {
    console.error('❌ Update system settings error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getSingleSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type, description, is_public FROM system_settings WHERE setting_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Setting not found'
      });
    }

    const setting = result.rows[0];
    let value = setting.setting_value;

    // Convert based on type
    if (setting.setting_type === 'boolean') {
      value = value === 'true';
    } else if (setting.setting_type === 'integer') {
      value = parseInt(value);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      setting: {
        key: setting.setting_key,
        value,
        type: setting.setting_type,
        description: setting.description,
        isPublic: setting.is_public
      }
    });
  } catch (error) {
    console.error('Get single setting error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// ============================================
// ADDITIONAL ADMIN METHODS (CRITICAL FIXES)
// ============================================

/**
 * Get system reports - aggregated data for admin dashboard
 */
export const getSystemReportsEnhanced = async (req, res) => {
  try {
    const [userStats, deptStats, projectStats, activityStats] = await Promise.all([
      pool.query(`SELECT r.name as role, COUNT(u.id) as count 
                  FROM users u 
                  JOIN roles r ON u.role_id = r.id 
                  GROUP BY r.name`),
      pool.query(`SELECT d.name, COUNT(u.id) as user_count 
                  FROM departments d 
                  LEFT JOIN users u ON d.id = u.department_id 
                  GROUP BY d.id, d.name`),
      pool.query(`SELECT status, COUNT(*) as count FROM projects GROUP BY status`),
      pool.query(`SELECT DATE(created_at) as date, COUNT(*) as count 
                  FROM activity_logs 
                  WHERE created_at >= NOW() - INTERVAL '30 days' 
                  GROUP BY DATE(created_at) 
                  ORDER BY date DESC`)
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        userStats: userStats.rows,
        departmentStats: deptStats.rows,
        projectStats: projectStats.rows,
        activityStats: activityStats.rows
      }
    });
  } catch (error) {
    console.error('Get system reports error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

/**
 * Get login history - track user login attempts
 */
export const getLoginHistoryEnhanced = async (req, res) => {
  try {
    const { user_id, limit = 50 } = req.query;

    let query = `SELECT lh.*, u.full_name, u.email 
                 FROM login_history lh 
                 JOIN users u ON lh.user_id = u.id`;
    const params = [];

    if (user_id) {
      query += ` WHERE lh.user_id = $1`;
      params.push(user_id);
    }

    query += ` ORDER BY lh.login_time DESC LIMIT ${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

/**
 * Get activity logs - audit trail of system actions
 */
export const getActivityLogsEnhanced = async (req, res) => {
  try {
    const { user_id, action, limit = 100 } = req.query;

    let query = `SELECT al.*, u.full_name, u.email 
                 FROM activity_logs al 
                 JOIN users u ON al.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (user_id) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (action) {
      conditions.push(`al.action ILIKE $${params.length + 1}`);
      params.push(`%${action}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};
