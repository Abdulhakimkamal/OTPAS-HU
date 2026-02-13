import pool from '../config/database.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

class CourseManagementController {
  /**
   * Register new course (Department Head only)
   */
  static registerCourse = async (req, res) => {
    try {
      const { title, code, description, credits, semester, academic_year, max_students } = req.body;
      const departmentId = req.departmentId; // Set by middleware
      const createdBy = req.user.id;

      // Check if course code already exists in the department
      const existingCourse = await pool.query(
        'SELECT id FROM courses WHERE code = $1 AND department_id = $2',
        [code, departmentId]
      );

      if (existingCourse.rows.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Course code already exists in this department'
        });
      }

      // Insert new course
      const insertQuery = `
        INSERT INTO courses (
          title, code, description, department_id, credits, semester, 
          academic_year, max_students, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const values = [title, code, description, departmentId, credits, semester, academic_year, max_students];
      const result = await pool.query(insertQuery, values);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Course registered successfully',
        course: result.rows[0]
      });

    } catch (error) {
      console.error('Register course error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Update course information (Department Head only)
   */
  static updateCourse = async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, code, description, credits, semester, academic_year, max_students, is_active } = req.body;
      const departmentId = req.departmentId;

      // Verify course belongs to department
      const courseCheck = await pool.query(
        'SELECT id FROM courses WHERE id = $1 AND department_id = $2',
        [courseId, departmentId]
      );

      if (courseCheck.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found in your department'
        });
      }

      // Update course
      const updateQuery = `
        UPDATE courses 
        SET title = $1, code = $2, description = $3, credits = $4, 
            semester = $5, academic_year = $6, max_students = $7, 
            is_active = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND department_id = $10
        RETURNING *
      `;

      const values = [title, code, description, credits, semester, academic_year, max_students, is_active, courseId, departmentId];
      const result = await pool.query(updateQuery, values);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Course updated successfully',
        course: result.rows[0]
      });

    } catch (error) {
      console.error('Update course error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Assign instructor to course (Department Head only)
   */
  static assignInstructorToCourse = async (req, res) => {
    try {
      const { courseId, instructorId } = req.body;
      const departmentId = req.departmentId;
      const assignedBy = req.user.id;

      // Verify course belongs to department
      const courseCheck = await pool.query(
        'SELECT id FROM courses WHERE id = $1 AND department_id = $2',
        [courseId, departmentId]
      );

      if (courseCheck.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found in your department'
        });
      }

      // Verify instructor exists and belongs to department
      const instructorCheck = await pool.query(
        `SELECT id FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1 AND r.name = 'instructor' AND u.department_id = $2`,
        [instructorId, departmentId]
      );

      if (instructorCheck.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Instructor not found in your department'
        });
      }

      // Insert or update course-instructor assignment
      const assignQuery = `
        INSERT INTO course_instructors (course_id, instructor_id, assigned_by, assigned_at, is_active)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
        ON CONFLICT (course_id, instructor_id) 
        DO UPDATE SET is_active = true, assigned_by = $3, assigned_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await pool.query(assignQuery, [courseId, instructorId, assignedBy]);

      // Also update the main courses table
      await pool.query(
        'UPDATE courses SET instructor_id = $1 WHERE id = $2',
        [instructorId, courseId]
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Instructor assigned to course successfully',
        assignment: result.rows[0]
      });

    } catch (error) {
      console.error('Assign instructor error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get department courses (Department Head only)
   */
  static getDepartmentCourses = async (req, res) => {
    try {
      const departmentId = req.departmentId;

      const query = `
        SELECT 
          c.*,
          u.full_name as instructor_name,
          u.email as instructor_email,
          COUNT(DISTINCT t.id) as tutorial_count,
          COUNT(DISTINCT tf.id) as file_count,
          COUNT(DISTINCT tv.id) as video_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN tutorials t ON c.id = t.course_id AND t.is_published = true
        LEFT JOIN tutorial_files tf ON t.id = tf.tutorial_id AND tf.is_active = true
        LEFT JOIN tutorial_videos tv ON t.id = tv.tutorial_id AND tv.is_active = true
        WHERE c.department_id = $1
        GROUP BY c.id, u.full_name, u.email
        ORDER BY c.title
      `;

      const result = await pool.query(query, [departmentId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        courses: result.rows
      });

    } catch (error) {
      console.error('Get department courses error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get available instructors in department (Department Head only)
   */
  static getAvailableInstructors = async (req, res) => {
    try {
      const departmentId = req.departmentId;

      const query = `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          COUNT(DISTINCT ci.course_id) as assigned_courses_count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN course_instructors ci ON u.id = ci.instructor_id AND ci.is_active = true
        WHERE r.name = 'instructor' AND u.department_id = $1 AND u.is_active = true
        GROUP BY u.id, u.full_name, u.email
        ORDER BY u.full_name
      `;

      const result = await pool.query(query, [departmentId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        instructors: result.rows
      });

    } catch (error) {
      console.error('Get available instructors error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get course materials monitoring dashboard (Department Head - Read Only)
   */
  static getCourseMaterialsDashboard = async (req, res) => {
    try {
      const departmentId = req.departmentId;

      // Get overview statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT c.id) as total_courses,
          COUNT(DISTINCT t.id) as total_tutorials,
          COUNT(DISTINCT tf.id) as total_files,
          COUNT(DISTINCT tv.id) as total_videos,
          COUNT(DISTINCT u.id) as total_instructors
        FROM courses c
        LEFT JOIN tutorials t ON c.id = t.course_id AND t.is_published = true
        LEFT JOIN tutorial_files tf ON t.id = tf.tutorial_id AND tf.is_active = true
        LEFT JOIN tutorial_videos tv ON t.id = tv.tutorial_id AND tv.is_active = true
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.department_id = $1 AND c.is_active = true
      `;

      const statsResult = await pool.query(statsQuery, [departmentId]);

      // Get recent activity
      const activityQuery = `
        SELECT 
          'file' as type,
          tf.file_name as title,
          t.title as tutorial_title,
          c.title as course_title,
          u.full_name as uploaded_by,
          tf.upload_date as created_at
        FROM tutorial_files tf
        JOIN tutorials t ON tf.tutorial_id = t.id
        JOIN courses c ON t.course_id = c.id
        JOIN users u ON tf.uploaded_by = u.id
        WHERE c.department_id = $1 AND tf.is_active = true
        
        UNION ALL
        
        SELECT 
          'video' as type,
          tv.video_title as title,
          t.title as tutorial_title,
          c.title as course_title,
          u.full_name as uploaded_by,
          tv.upload_date as created_at
        FROM tutorial_videos tv
        JOIN tutorials t ON tv.tutorial_id = t.id
        JOIN courses c ON t.course_id = c.id
        JOIN users u ON tv.uploaded_by = u.id
        WHERE c.department_id = $1 AND tv.is_active = true
        
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const activityResult = await pool.query(activityQuery, [departmentId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        dashboard: {
          statistics: statsResult.rows[0],
          recent_activity: activityResult.rows
        }
      });

    } catch (error) {
      console.error('Get course materials dashboard error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };
}

export default CourseManagementController;