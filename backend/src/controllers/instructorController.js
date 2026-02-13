import pool from '../config/database.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import bcrypt from 'bcryptjs';
import { calculateGrade, calculateCumulativeScore, validateScore, validateScoreForEvaluationType } from '../utils/gradeCalculator.js';

// ============================================
// STUDENT MANAGEMENT (READ ONLY)
// ============================================

export const getAssignedStudents = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        u.username,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      INNER JOIN courses c ON c.instructor_id = $1
      INNER JOIN enrollments e ON e.course_id = c.id AND e.student_id = u.id
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
      ORDER BY u.full_name
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      students: result.rows
    });
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch assigned students'
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { id } = req.params;

    // Verify instructor has access to this student
    const accessCheck = `
      SELECT COUNT(*) as count
      FROM courses c
      INNER JOIN enrollments e ON e.course_id = c.id
      WHERE c.instructor_id = $1 AND e.student_id = $2
    `;
    
    const accessResult = await pool.query(accessCheck, [instructor_id, id]);
    
    if (accessResult.rows[0].count === '0') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.username,
        u.phone,
        u.bio,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      student: result.rows[0]
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch student details'
    });
  }
};

export const getStudentProgress = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { id } = req.params;

    // Verify access
    const accessCheck = `
      SELECT COUNT(*) as count
      FROM courses c
      INNER JOIN enrollments e ON e.course_id = c.id
      WHERE c.instructor_id = $1 AND e.student_id = $2
    `;
    
    const accessResult = await pool.query(accessCheck, [instructor_id, id]);
    
    if (accessResult.rows[0].count === '0') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = `
      SELECT 
        c.title as course_title,
        c.code as course_code,
        e.grade,
        e.status,
        e.enrolled_at
      FROM enrollments e
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = $1 AND c.instructor_id = $2
      ORDER BY e.enrolled_at DESC
    `;

    const result = await pool.query(query, [id, instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      progress: result.rows
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch student progress'
    });
  }
};

// ============================================
// EVALUATIONS
// ============================================

export const createEvaluation = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { student_id, course_id, score, feedback, evaluation_type } = req.body;

    // Validate score
    const scoreValidation = validateScore(score);
    if (!scoreValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid score',
        errors: scoreValidation.errors
      });
    }

    const validatedScore = scoreValidation.score;

    // Validate score for evaluation type
    const typeValidation = validateScoreForEvaluationType(validatedScore, evaluation_type);
    if (!typeValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Score exceeds maximum for evaluation type',
        errors: typeValidation.errors
      });
    }

    // Calculate grade automatically based on percentage for evaluation type
    const maxScore = typeValidation.maxScore;
    const percentage = (validatedScore / maxScore) * 100;
    const grade = calculateGrade(percentage);

    // Verify instructor teaches this course
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
      [course_id, instructor_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not teach this course'
      });
    }

    // Verify student is enrolled in the course
    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [student_id, course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    const query = `
      INSERT INTO course_evaluations (student_id, course_id, instructor_id, score, grade, feedback, evaluation_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      student_id,
      course_id,
      instructor_id,
      validatedScore,
      grade,
      feedback,
      evaluation_type || 'quiz'
    ]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      evaluation: result.rows[0],
      message: `Evaluation created successfully with grade ${grade}`
    });
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create evaluation'
    });
  }
};

export const updateEvaluation = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { id } = req.params;
    const { score, feedback, evaluation_type } = req.body;

    // Validate score
    const scoreValidation = validateScore(score);
    if (!scoreValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid score',
        errors: scoreValidation.errors
      });
    }

    const validatedScore = scoreValidation.score;

    // Get current evaluation to check type if not provided
    let currentEvaluationType = evaluation_type;
    if (!currentEvaluationType) {
      const currentEval = await pool.query(
        'SELECT evaluation_type FROM course_evaluations WHERE id = $1 AND instructor_id = $2',
        [id, instructor_id]
      );
      if (currentEval.rows.length > 0) {
        currentEvaluationType = currentEval.rows[0].evaluation_type;
      }
    }

    // Validate score for evaluation type and calculate grade
    let grade;
    if (currentEvaluationType) {
      const typeValidation = validateScoreForEvaluationType(validatedScore, currentEvaluationType);
      if (!typeValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Score exceeds maximum for evaluation type',
          errors: typeValidation.errors
        });
      }
      
      // Calculate grade automatically based on percentage for evaluation type
      const maxScore = typeValidation.maxScore;
      const percentage = (validatedScore / maxScore) * 100;
      grade = calculateGrade(percentage);
    } else {
      // Fallback to direct score if no evaluation type
      grade = calculateGrade(validatedScore);
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM course_evaluations WHERE id = $1 AND instructor_id = $2',
      [id, instructor_id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = `
      UPDATE course_evaluations
      SET score = $1, grade = $2, feedback = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [validatedScore, grade, feedback, id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      evaluation: result.rows[0],
      message: `Evaluation updated successfully with grade ${grade}`
    });
  } catch (error) {
    console.error('Update evaluation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update evaluation'
    });
  }
};

export const getEvaluations = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        e.*,
        u.full_name as student_name,
        c.title as course_title,
        c.code as course_code
      FROM course_evaluations e
      INNER JOIN users u ON u.id = e.student_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.instructor_id = $1
      ORDER BY e.created_at DESC
    `;

    const result = await pool.query(query, [instructor_id]);
    
    // Add cumulative totals for each evaluation
    const evaluationsWithTotals = [];
    
    for (const evaluation of result.rows) {
      try {
        // Add cumulative data for each evaluation
        const cumulativeData = await calculateCumulativeScore(
          evaluation.student_id, 
          evaluation.course_id, 
          pool
        );
        
        evaluation.cumulative_total = cumulativeData.totalScore;
        evaluation.breakdown = cumulativeData.breakdown;
      } catch (error) {
        console.error(`Error calculating cumulative score for evaluation ${evaluation.id}:`, error);
        evaluation.cumulative_total = 0;
        evaluation.breakdown = { mid_exam: 0, final_exam: 0, project: 0, quiz: 0 };
      }
      
      evaluationsWithTotals.push(evaluation);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      evaluations: evaluationsWithTotals
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch evaluations'
    });
  }
};

// ============================================
// FEEDBACK & GUIDANCE
// ============================================

export const createFeedback = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { student_id, course_id, feedback_text, feedback_type } = req.body;

    const query = `
      INSERT INTO feedback (student_id, course_id, instructor_id, feedback_text, feedback_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      student_id,
      course_id,
      instructor_id,
      feedback_text,
      feedback_type || 'general'
    ]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create feedback'
    });
  }
};

export const getFeedback = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        f.*,
        u.full_name as student_name,
        c.title as course_title
      FROM feedback f
      INNER JOIN users u ON u.id = f.student_id
      INNER JOIN courses c ON c.id = f.course_id
      WHERE f.instructor_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      feedback: result.rows
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};

// ============================================
// PROJECT COMMENTS (NEW)
// ============================================

export const addProjectComment = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { project_id, student_id, comment_text } = req.body;

    const query = `
      INSERT INTO project_comments (project_id, instructor_id, student_id, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [project_id, instructor_id, student_id, comment_text]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      comment: result.rows[0],
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add project comment error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

export const getProjectComments = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        pc.*,
        u.full_name as instructor_name
      FROM project_comments pc
      INNER JOIN users u ON u.id = pc.instructor_id
      WHERE pc.project_id = $1
      ORDER BY pc.created_at DESC
    `;

    const result = await pool.query(query, [id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('Get project comments error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

// ============================================
// ANNOUNCEMENTS (NEW)
// ============================================

export const createAnnouncement = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { course_id, title, message } = req.body;

    // Handle optional file attachment
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
    }

    const query = `
      INSERT INTO instructor_announcements (instructor_id, course_id, title, message, attachment_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      instructor_id,
      course_id || null,
      title,
      message,
      attachment_url
    ]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      announcement: result.rows[0],
      message: 'Announcement posted successfully'
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        a.*,
        c.title as course_title,
        c.code as course_code
      FROM instructor_announcements a
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE a.instructor_id = $1 AND a.is_active = true
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      announcements: result.rows
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
};

// ============================================
// COURSE MATERIALS (NEW)
// ============================================

export const uploadFile = async (req, res) => {
  try {
    // This is a basic file upload handler
    // In production, you would integrate with cloud storage like AWS S3, Cloudinary, etc.
    
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // For demo purposes, we'll create a mock URL
    // In production, upload to cloud storage and return the real URL
    const fileUrl = `https://example.com/uploads/${Date.now()}_${req.file.originalname}`;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
};

// ============================================
// REPORTING
// ============================================

export const getReports = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.code as course_code,
        COUNT(DISTINCT e.student_id) as total_students,
        AVG(ce.score) as average_score,
        COUNT(ce.id) as total_evaluations
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_evaluations ce ON ce.course_id = c.id
      WHERE c.instructor_id = $1
      GROUP BY c.id, c.title, c.code
      ORDER BY c.title
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      reports: result.rows
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN ce.evaluation_type = 'project' THEN ce.id END) as total_projects,
        COUNT(DISTINCT ce.id) as total_evaluations
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_evaluations ce ON ce.course_id = c.id
      WHERE c.instructor_id = $1
    `;

    const result = await pool.query(statsQuery, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      analytics: result.rows[0]
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

export const getProfile = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.username,
        u.phone,
        u.bio,
        u.profile_picture,
        d.name as department_name,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { full_name, phone, bio } = req.body;

    const query = `
      UPDATE users
      SET full_name = $1, phone = $2, bio = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, full_name, email, phone, bio
    `;

    const result = await pool.query(query, [full_name, phone, bio, instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      profile: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { current_password, new_password } = req.body;

    // Verify current password
    const userQuery = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [instructor_id]
    );

    const user = userQuery.rows[0];
    const isValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, instructor_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// ============================================
// MY COURSES
// ============================================

export const getMyCourses = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        c.*,
        d.name as department_name,
        COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.instructor_id = $1
      GROUP BY c.id, d.name
      ORDER BY c.semester DESC, c.title
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      courses: result.rows
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

// ============================================
// GRADE CALCULATION (NEW)
// ============================================

export const calculateGradeFromScore = async (req, res) => {
  try {
    const { score } = req.body;

    // Validate score
    const scoreValidation = validateScore(score);
    if (!scoreValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid score',
        errors: scoreValidation.errors
      });
    }

    const validatedScore = scoreValidation.score;
    const grade = calculateGrade(validatedScore);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      score: validatedScore,
      grade,
      message: `Score ${validatedScore} corresponds to grade ${grade}`
    });
  } catch (error) {
    console.error('Calculate grade error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to calculate grade'
    });
  }
};

// ============================================
// CUMULATIVE SCORE CALCULATION (NEW)
// ============================================

export const getCumulativeScore = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { student_id, course_id } = req.params;

    // Verify instructor teaches this course
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
      [course_id, instructor_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not teach this course'
      });
    }

    const cumulativeData = await calculateCumulativeScore(student_id, course_id, pool);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      student_id: parseInt(student_id),
      course_id: parseInt(course_id),
      cumulative_total: cumulativeData.totalScore,
      breakdown: cumulativeData.breakdown,
      max_possible: cumulativeData.maxPossible
    });
  } catch (error) {
    console.error('Get cumulative score error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to calculate cumulative score'
    });
  }
};

// ============================================
// SETTINGS
// ============================================

export const updateNotificationSettings = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const settings = req.body;

    // For now, we'll store notification settings in a simple JSON format
    // In a real app, you might want a separate settings table
    const query = `
      UPDATE users
      SET notification_settings = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, notification_settings
    `;

    const result = await pool.query(query, [JSON.stringify(settings), instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      settings: result.rows[0].notification_settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT notification_settings
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [instructor_id]);
    const settings = result.rows[0]?.notification_settings || {
      emailNotifications: true,
      pushNotifications: true,
      evaluationReminders: true,
      courseUpdates: true,
      systemAlerts: true
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      settings: typeof settings === 'string' ? JSON.parse(settings) : settings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to get notification settings'
    });
  }
};

// ============================================
// TUTORIALS (INSTRUCTOR MANAGEMENT)
// ============================================

export const getInstructorTutorials = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.content,
        t.difficulty_level,
        t.duration_minutes,
        t.is_published,
        t.views_count,
        t.created_at,
        c.title as course_title,
        c.code as course_code
      FROM tutorials t
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.instructor_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      tutorials: result.rows
    });
  } catch (error) {
    console.error('Get instructor tutorials error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch tutorials'
    });
  }
};

export const getAssignedCourses = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const query = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.code as course_code,
        c.description,
        c.credits,
        c.semester,
        c.academic_year,
        COUNT(t.id) as tutorial_count
      FROM courses c
      LEFT JOIN tutorials t ON c.id = t.course_id AND t.instructor_id = $1
      WHERE c.instructor_id = $1 AND c.is_active = true
      GROUP BY c.id, c.title, c.code, c.description, c.credits, c.semester, c.academic_year
      ORDER BY c.title
    `;

    const result = await pool.query(query, [instructor_id]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      courses: result.rows
    });
  } catch (error) {
    console.error('Get assigned courses error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch assigned courses'
    });
  }
};

// ============================================
// COURSE-BASED TUTORIAL MANAGEMENT (NEW)
// ============================================

export const getCourseTutorials = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId } = req.params;

    console.log('=== GET COURSE TUTORIALS ===');
    console.log('Instructor ID:', instructor_id);
    console.log('Course ID:', courseId);

    // Verify instructor has access to this course
    const courseCheck = await pool.query(
      'SELECT id, title, instructor_id FROM courses WHERE id = $1 AND instructor_id = $2',
      [courseId, instructor_id]
    );

    console.log('Course check result:', courseCheck.rows.length);
    if (courseCheck.rows.length > 0) {
      console.log('Course found:', courseCheck.rows[0]);
    }

    if (courseCheck.rows.length === 0) {
      console.log('ERROR: Access denied - course not found or not owned by instructor');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this course'
      });
    }

    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.content,
        t.difficulty_level,
        t.duration_minutes,
        t.is_published,
        t.views_count,
        t.created_at,
        c.title as course_title,
        c.code as course_code
      FROM tutorials t
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.course_id = $1 AND t.instructor_id = $2
      ORDER BY t.created_at DESC
    `;

    console.log('Executing query with params:', [courseId, instructor_id]);
    const result = await pool.query(query, [courseId, instructor_id]);

    console.log('Tutorials found:', result.rows.length);
    result.rows.forEach((row, idx) => {
      console.log(`  Tutorial ${idx + 1}:`, row.id, row.title);
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      tutorials: result.rows
    });
  } catch (error) {
    console.error('Get course tutorials error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch course tutorials'
    });
  }
};

export const createCourseTutorial = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId } = req.params;
    const { title, description, content, difficulty_level, duration_minutes, is_published } = req.body;

    // Verify instructor has access to this course
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
      [courseId, instructor_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this course'
      });
    }

    const query = `
      INSERT INTO tutorials (
        title, description, content, course_id, instructor_id,
        difficulty_level, duration_minutes, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      title, description, content, courseId, instructor_id,
      difficulty_level, duration_minutes, is_published || false
    ]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      tutorial: result.rows[0]
    });
  } catch (error) {
    console.error('Create course tutorial error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create tutorial'
    });
  }
};

export const getCourseTutorialFiles = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId } = req.params;

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    const query = `
      SELECT 
        tf.id,
        tf.tutorial_id,
        tf.file_name,
        tf.file_path,
        tf.file_type,
        tf.file_size,
        tf.video_url,
        tf.video_type,
        tf.thumbnail_url,
        tf.duration_seconds,
        tf.is_external,
        tf.upload_date as uploaded_at
      FROM tutorial_files tf
      WHERE tf.tutorial_id = $1
      ORDER BY tf.upload_date DESC
    `;

    const result = await pool.query(query, [tutorialId]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      files: result.rows
    });
  } catch (error) {
    console.error('Get tutorial files error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch tutorial files'
    });
  }
};

export const uploadCourseTutorialFile = async (req, res) => {
  try {
    console.log('=== FILE UPLOAD REQUEST ===');
    console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');
    console.log('Params:', req.params);
    console.log('User:', req.user?.id);
    
    const instructor_id = req.user.id;
    const { courseId, tutorialId } = req.params;

    if (!req.file) {
      console.log('ERROR: No file provided');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Verify instructor has access to this course and tutorial
    console.log('Checking instructor access...');
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      console.log('ERROR: Access denied - tutorial not found or not owned by instructor');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    console.log('Access verified, inserting file record...');
    const query = `
      INSERT INTO tutorial_files (
        tutorial_id, file_name, file_path, file_type, file_size, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tutorialId,
      req.file.originalname,
      req.file.path,
      req.file.mimetype,
      req.file.size,
      instructor_id
    ]);

    console.log('File record inserted successfully:', result.rows[0].id);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Upload tutorial file error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File too large. Maximum file size is 100MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files. Please upload one file at a time.'
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid file type. Only PDF, Word, PowerPoint, ZIP, and image files are allowed.'
      });
    }

    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to upload file: ' + error.message
    });
  }
};

export const deleteCourseTutorialFile = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId, fileId } = req.params;

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    const query = 'DELETE FROM tutorial_files WHERE id = $1 AND tutorial_id = $2';
    const result = await pool.query(query, [fileId, tutorialId]);

    if (result.rowCount === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete tutorial file error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};

export const downloadCourseTutorialFile = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId, fileId } = req.params;

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    // Get file info
    const fileQuery = 'SELECT * FROM tutorial_files WHERE id = $1 AND tutorial_id = $2';
    const fileResult = await pool.query(fileQuery, [fileId, tutorialId]);

    if (fileResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = fileResult.rows[0];
    
    // For now, return file info (in production, you'd serve the actual file)
    res.status(HTTP_STATUS.OK).json({
      success: true,
      file: {
        id: file.id,
        name: file.file_name,
        path: file.file_path,
        type: file.file_type,
        size: file.file_size
      },
      message: 'File download info retrieved'
    });
  } catch (error) {
    console.error('Download tutorial file error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to download file'
    });
  }
};


export const updateCourseTutorial = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId } = req.params;
    const { title, description, difficulty_level, duration_minutes, is_published } = req.body;

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    const query = `
      UPDATE tutorials
      SET 
        title = $1,
        description = $2,
        difficulty_level = $3,
        duration_minutes = $4,
        is_published = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      description,
      difficulty_level,
      duration_minutes,
      is_published || false,
      tutorialId
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      tutorial: result.rows[0]
    });
  } catch (error) {
    console.error('Update course tutorial error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update tutorial'
    });
  }
};


// Helper function to determine file type
const getFileType = (filename, mimetype) => {
  if (mimetype && mimetype.startsWith('video/')) return 'video';
  if (mimetype && mimetype.startsWith('image/')) return 'image';
  if (mimetype && mimetype.includes('pdf')) return 'pdf';
  if (mimetype && (mimetype.includes('word') || filename.endsWith('.docx') || filename.endsWith('.doc'))) return 'doc';
  if (mimetype && (mimetype.includes('powerpoint') || filename.endsWith('.pptx') || filename.endsWith('.ppt'))) return 'ppt';
  return 'document';
};

// Add video link to tutorial
export const addVideoLink = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId } = req.params;
    const { title, description, video_url, video_type, thumbnail_url, duration_seconds } = req.body;

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    // Add video link to tutorial_files table
    const query = `
      INSERT INTO tutorial_files (
        tutorial_id, file_name, video_url, file_type, video_type, uploaded_by, is_external, thumbnail_url, duration_seconds
      ) VALUES ($1, $2, $3, 'video', $4, $5, true, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tutorialId,
      title || 'Video Link',
      video_url,
      video_type || 'custom',
      instructor_id,
      thumbnail_url || null,
      duration_seconds || null
    ]);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Add video link error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to add video link'
    });
  }
};

// Get tutorial files with filtering
export const getCourseTutorialFilesFiltered = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const { courseId, tutorialId } = req.params;
    const { type } = req.query; // 'all', 'videos', 'documents'

    // Verify instructor has access to this course and tutorial
    const tutorialCheck = await pool.query(`
      SELECT t.id FROM tutorials t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND t.course_id = $2 AND c.instructor_id = $3
    `, [tutorialId, courseId, instructor_id]);

    if (tutorialCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this tutorial'
      });
    }

    let query = `
      SELECT 
        tf.id,
        tf.tutorial_id,
        tf.file_name,
        tf.file_path,
        tf.file_type,
        tf.file_size,
        tf.video_url,
        tf.thumbnail_url,
        tf.duration_seconds,
        tf.is_external,
        tf.upload_date as uploaded_at
      FROM tutorial_files tf
      WHERE tf.tutorial_id = $1
    `;

    const params = [tutorialId];

    // Apply type filter
    if (type === 'videos') {
      query += ` AND tf.file_type = 'video'`;
    } else if (type === 'documents') {
      query += ` AND tf.file_type != 'video'`;
    }

    query += ` ORDER BY tf.upload_date DESC`;

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      files: result.rows
    });
  } catch (error) {
    console.error('Get tutorial files error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch tutorial files'
    });
  }
};
