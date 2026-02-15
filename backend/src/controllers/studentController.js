import pool from '../config/database.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

export const getAssignedInstructor = async (req, res) => {
  try {
    const student_id = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        isa.instructor_id,
        u.username as instructor_name,
        u.email as instructor_email
      FROM instructor_student_assignments isa
      JOIN users u ON isa.instructor_id = u.id
      WHERE isa.student_id = $1
      LIMIT 1`,
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No instructor assigned to this student'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get assigned instructor error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const submitProject = async (req, res) => {
  try {
    const { title, description, course_id } = req.body;
    const student_id = req.user.id;
    
    // Get file URL from uploaded file (if any)
    let file_url = '';
    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO projects (title, description, course_id, student_id, file_url, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, 'submitted', NOW())
       RETURNING *`,
      [title, description, course_id, student_id, file_url]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [student_id, 'Project Submitted', 'project', result.rows[0].id]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Project submitted successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get recommendations from database
    const result = await pool.query(
      `SELECT r.* FROM recommendations r
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [student_id]
    );

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

export const submitFeedback = async (req, res) => {
  try {
    const { feedback_text, rating, tutorial_id } = req.body;
    const student_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO feedback (student_id, tutorial_id, content, rating, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [student_id, tutorial_id || null, feedback_text, rating]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getProgress = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT * FROM student_progress WHERE student_id = $1`,
      [student_id]
    );

    if (result.rows.length === 0) {
      // Create initial progress record
      await pool.query(
        `INSERT INTO student_progress (student_id) VALUES ($1)`,
        [student_id]
      );
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        progress: {
          student_id,
          total_projects: 0,
          completed_projects: 0,
          average_score: 0,
          tutorials_completed: 0
        }
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getStudentProjects = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT p.*, c.title as course_title, c.code as course_code 
       FROM projects p 
       LEFT JOIN courses c ON p.course_id = c.id 
       WHERE p.student_id = $1 
       ORDER BY p.created_at DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error('Get student projects error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getStudentEvaluations = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT e.*, p.title as project_title, u.full_name as instructor_name 
       FROM evaluations e 
       JOIN projects p ON e.project_id = p.id 
       JOIN users u ON e.instructor_id = u.id 
       WHERE e.student_id = $1 
       ORDER BY e.created_at DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      evaluations: result.rows
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// New dashboard endpoint
export const getDashboardData = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get enrolled courses count
    const coursesResult = await pool.query(
      `SELECT COUNT(*) as count FROM course_enrollments WHERE student_id = $1`,
      [student_id]
    );

    // Get active projects count
    const projectsResult = await pool.query(
      `SELECT COUNT(*) as count FROM projects WHERE student_id = $1 AND status IN ('submitted', 'under_review', 'draft')`,
      [student_id]
    );

    // Get completed tutorials count
    const tutorialsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tutorial_progress WHERE student_id = $1 AND is_completed = true`,
      [student_id]
    );

    // Calculate overall progress (mock calculation)
    const progressResult = await pool.query(
      `SELECT AVG(completion_percentage) as avg_progress FROM course_progress WHERE student_id = $1`,
      [student_id]
    );

    const dashboardStats = {
      enrolledCourses: parseInt(coursesResult.rows[0].count) || 0,
      activeProjects: parseInt(projectsResult.rows[0].count) || 0,
      tutorialsCompleted: parseInt(tutorialsResult.rows[0].count) || 0,
      overallProgress: Math.round(parseFloat(progressResult.rows[0].avg_progress) || 0)
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: dashboardStats
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get announcements for student
export const getAnnouncements = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get student's department and enrolled courses
    const studentInfo = await pool.query(
      `SELECT u.department_id, array_agg(DISTINCT ce.course_id) as course_ids
       FROM users u
       LEFT JOIN course_enrollments ce ON ce.student_id = u.id
       WHERE u.id = $1
       GROUP BY u.department_id`,
      [student_id]
    );

    const department_id = studentInfo.rows[0]?.department_id;
    const course_ids = studentInfo.rows[0]?.course_ids || [];

    // Get announcements from admin, department head, and instructors
    let query = `
      SELECT 
        a.id,
        a.title,
        a.message,
        a.created_at,
        a.priority,
        'admin' as source,
        'System' as source_name,
        NULL as course_name,
        NULL as course_code
      FROM admin_announcements a
      WHERE a.is_active = true
      
      UNION ALL
      
      SELECT 
        da.id,
        da.title,
        da.message,
        da.created_at,
        da.priority,
        'department_head' as source,
        u.full_name as source_name,
        NULL as course_name,
        NULL as course_code
      FROM department_announcements da
      JOIN users u ON u.id = da.department_head_id
      WHERE da.is_active = true AND da.department_id = $1
    `;

    const params = [department_id];

    if (course_ids.length > 0) {
      query += `
        UNION ALL
        
        SELECT 
          ia.id,
          ia.title,
          ia.message,
          ia.created_at,
          'medium' as priority,
          'instructor' as source,
          u.full_name as source_name,
          c.title as course_name,
          c.code as course_code
        FROM instructor_announcements ia
        JOIN users u ON u.id = ia.instructor_id
        LEFT JOIN courses c ON c.id = ia.course_id
        WHERE ia.is_active = true AND (ia.course_id = ANY($2) OR ia.course_id IS NULL)
      `;
      params.push(course_ids);
    }

    query += ` ORDER BY created_at DESC LIMIT 10`;

    const result = await pool.query(query, params);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      announcements: result.rows
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get course materials for student
// Get project submissions for student
export const getProjectSubmissions = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        p.*,
        c.title as course_name,
        c.code as course_code,
        ce.grade,
        ce.feedback
       FROM projects p
       JOIN courses c ON c.id = p.course_id
       LEFT JOIN course_evaluations ce ON ce.student_id = p.student_id AND ce.course_id = p.course_id AND ce.evaluation_type = 'project'
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error('Get project submissions error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get instructor recommendations for student
export const getInstructorRecommendations = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        ir.*,
        i.full_name as instructor_name,
        i.email as instructor_email,
        c.title as course_title,
        c.code as course_code
       FROM instructor_recommendations ir
       JOIN users i ON i.id = ir.instructor_id
       LEFT JOIN course_evaluations ce ON ce.id = ir.evaluation_id
       LEFT JOIN courses c ON c.id = ce.course_id
       WHERE ir.student_id = $1 AND ir.status = 'Submitted'
       ORDER BY ir.created_at DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      recommendations: result.rows
    });
  } catch (error) {
    console.error('Get instructor recommendations error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Mark instructor recommendation as read
export const markRecommendationAsRead = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE instructor_recommendations 
       SET is_read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND student_id = $2
       RETURNING *`,
      [id, student_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recommendation marked as read',
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Mark recommendation as read error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get available courses for enrollment
export const getAvailableCourses = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get courses that the student is not already enrolled in
    const result = await pool.query(
      `SELECT c.id, c.title, c.code, c.description, c.credits, c.semester, c.academic_year,
              d.name as department_name, u.full_name as instructor_name,
              c.max_students, c.enrolled_count,
              CASE WHEN ce.student_id IS NOT NULL THEN true ELSE false END as is_enrolled
       FROM courses c
       JOIN departments d ON c.department_id = d.id
       JOIN users u ON c.instructor_id = u.id
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.student_id = $1
       WHERE c.is_active = true
       ORDER BY c.code`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      courses: result.rows
    });
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { course_id } = req.body;

    // Check if course exists and is active
    const courseCheck = await pool.query(
      `SELECT id, title, code, max_students, enrolled_count 
       FROM courses 
       WHERE id = $1 AND is_active = true`,
      [course_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found or not active'
      });
    }

    const course = courseCheck.rows[0];

    // Check if student is already enrolled
    const enrollmentCheck = await pool.query(
      `SELECT id FROM course_enrollments 
       WHERE student_id = $1 AND course_id = $2`,
      [student_id, course_id]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Check if course has space (if max_students is set)
    if (course.max_students && course.enrolled_count >= course.max_students) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Course is full'
      });
    }

    // Enroll the student
    const enrollResult = await pool.query(
      `INSERT INTO course_enrollments (student_id, course_id, enrollment_date)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [student_id, course_id]
    );

    // Update enrolled count
    await pool.query(
      `UPDATE courses 
       SET enrolled_count = enrolled_count + 1 
       WHERE id = $1`,
      [course_id]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Successfully enrolled in ${course.title} (${course.code})`,
      enrollment: enrollResult.rows[0]
    });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Get enrolled courses
export const getEnrolledCourses = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT c.id, c.title, c.code, c.description, c.credits, c.semester, c.academic_year,
              d.name as department_name, u.full_name as instructor_name, u.email as instructor_email,
              ce.enrollment_date, ce.completion_percentage, ce.is_completed,
              COUNT(t.id) as tutorial_count
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN departments d ON c.department_id = d.id
       JOIN users u ON c.instructor_id = u.id
       LEFT JOIN tutorials t ON t.course_id = c.id AND t.is_published = true
       WHERE ce.student_id = $1
       GROUP BY c.id, c.title, c.code, c.description, c.credits, c.semester, c.academic_year,
                d.name, u.full_name, u.email, ce.enrollment_date, ce.completion_percentage, ce.is_completed
       ORDER BY ce.enrollment_date DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      courses: result.rows
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

// Unenroll from a course
export const unenrollFromCourse = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { course_id } = req.params;

    // Check if student is enrolled
    const enrollmentCheck = await pool.query(
      `SELECT ce.id, c.title, c.code 
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       WHERE ce.student_id = $1 AND ce.course_id = $2`,
      [student_id, course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    const course = enrollmentCheck.rows[0];

    // Remove enrollment
    await pool.query(
      `DELETE FROM course_enrollments 
       WHERE student_id = $1 AND course_id = $2`,
      [student_id, course_id]
    );

    // Update enrolled count
    await pool.query(
      `UPDATE courses 
       SET enrolled_count = GREATEST(enrolled_count - 1, 0) 
       WHERE id = $1`,
      [course_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Successfully unenrolled from ${course.title} (${course.code})`
    });
  } catch (error) {
    console.error('Unenroll from course error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};


// ============================================
// TUTORIALS
// ============================================

export const getTutorials = async (req, res) => {
  try {
    const student_id = req.user.id;
    
    // Get tutorials from courses the student is enrolled in
    const result = await pool.query(
      `SELECT 
        t.id,
        t.title,
        t.description,
        t.content,
        t.course_id,
        t.instructor_id,
        t.file_url,
        t.video_url,
        t.duration_minutes,
        t.difficulty_level,
        t.views_count,
        t.created_at,
        c.title as course_title,
        c.code as course_code,
        u.full_name as instructor_name,
        COALESCE(tp.is_completed, false) as is_completed,
        COALESCE(tp.completion_percentage, 0) as progress_percentage,
        tp.completed_at,
        tp.viewed_at as time_spent_minutes
      FROM tutorials t
      LEFT JOIN courses c ON t.course_id = c.id
      LEFT JOIN users u ON t.instructor_id = u.id
      LEFT JOIN tutorial_progress tp ON (t.id = tp.tutorial_id AND tp.student_id = $1)
      INNER JOIN course_enrollments ce ON (c.id = ce.course_id AND ce.student_id = $1 AND ce.is_completed = false)
      ORDER BY t.created_at DESC`,
      [student_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get tutorials error:', error);
    console.error('Error details:', error.message);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const getTutorialById = async (req, res) => {
  try {
    const student_id = req.user.id;
    const tutorial_id = parseInt(req.params.id);
    
    // Get tutorial details with progress
    const result = await pool.query(
      `SELECT 
        t.id,
        t.title,
        t.description,
        t.content,
        t.course_id,
        t.instructor_id,
        t.file_url,
        t.video_url,
        t.duration_minutes,
        t.difficulty_level,
        t.views_count,
        t.created_at,
        c.title as course_title,
        c.code as course_code,
        u.full_name as instructor_name,
        tp.is_completed,
        tp.progress_percentage,
        tp.completed_at,
        tp.time_spent_minutes
      FROM tutorials t
      LEFT JOIN courses c ON t.course_id = c.id
      LEFT JOIN users u ON t.instructor_id = u.id
      LEFT JOIN tutorial_progress tp ON t.id = tp.tutorial_id AND tp.student_id = $1
      WHERE t.id = $2 AND t.is_published = true`,
      [student_id, tutorial_id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Tutorial not found'
      });
    }

    // Increment views count
    await pool.query(
      'UPDATE tutorials SET views_count = views_count + 1 WHERE id = $1',
      [tutorial_id]
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get tutorial by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const updateTutorialProgress = async (req, res) => {
  try {
    const student_id = req.user.id;
    const tutorial_id = parseInt(req.params.id);
    const { progress_percentage, time_spent_minutes, is_completed } = req.body;
    
    // Check if progress record exists
    const existing = await pool.query(
      'SELECT id FROM tutorial_progress WHERE student_id = $1 AND tutorial_id = $2',
      [student_id, tutorial_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing progress
      result = await pool.query(
        `UPDATE tutorial_progress 
         SET progress_percentage = $1, 
             time_spent_minutes = $2, 
             is_completed = $3,
             completed_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE completed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $4 AND tutorial_id = $5
         RETURNING *`,
        [progress_percentage, time_spent_minutes, is_completed, student_id, tutorial_id]
      );
    } else {
      // Create new progress record
      result = await pool.query(
        `INSERT INTO tutorial_progress 
         (student_id, tutorial_id, progress_percentage, time_spent_minutes, is_completed, completed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 = true THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
         RETURNING *`,
        [student_id, tutorial_id, progress_percentage, time_spent_minutes, is_completed]
      );
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update tutorial progress error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};

export const markTutorialComplete = async (req, res) => {
  try {
    const student_id = req.user.id;
    const tutorial_id = parseInt(req.params.id);
    
    // Check if progress record exists
    const existing = await pool.query(
      'SELECT id FROM tutorial_progress WHERE student_id = $1 AND tutorial_id = $2',
      [student_id, tutorial_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing progress
      result = await pool.query(
        `UPDATE tutorial_progress 
         SET is_completed = true, 
             progress_percentage = 100,
             completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $1 AND tutorial_id = $2
         RETURNING *`,
        [student_id, tutorial_id]
      );
    } else {
      // Create new progress record
      result = await pool.query(
        `INSERT INTO tutorial_progress 
         (student_id, tutorial_id, progress_percentage, is_completed, completed_at, created_at)
         VALUES ($1, $2, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [student_id, tutorial_id]
      );
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Tutorial marked as complete',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Mark tutorial complete error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR
    });
  }
};
// ============================================
