import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import ProjectModel from '../models/project.model.js';
import pool from '../config/database.js';

/**
 * Verify that the instructor is assigned to the student
 * Used to ensure instructors can only evaluate their assigned students
 */
export const verifyInstructorAssignment = async (req, res, next) => {
  try {
    let { studentId, project_id } = req.body || req.params;
    const instructorId = req.user?.id;

    if (!instructorId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing instructor ID'
      });
    }

    // If project_id is provided instead of studentId, get studentId from project
    if (!studentId && project_id) {
      const projectQuery = 'SELECT student_id FROM projects WHERE id = $1';
      const projectResult = await pool.query(projectQuery, [project_id]);
      
      if (projectResult.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }
      
      studentId = projectResult.rows[0].student_id;
    }

    if (!studentId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing student ID or project ID'
      });
    }

    // Check if instructor is assigned to student
    const query = `
      SELECT 1 FROM instructor_student_assignments
      WHERE instructor_id = $1 AND student_id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [instructorId, studentId]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Instructor is not assigned to this student'
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying instructor assignment:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying instructor assignment'
    });
  }
};

/**
 * Verify that the user owns the project
 * Used to ensure students can only access their own projects
 */
export const verifyProjectOwnership = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.id;

    if (!projectId || !userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing project ID or user ID'
      });
    }

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is the student who owns the project
    if (project.student_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to access this project'
      });
    }

    // Attach project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error('Error verifying project ownership:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying project ownership'
    });
  }
};

/**
 * Verify that the project title is approved before allowing file upload
 * Used to enforce the workflow: title approval -> file upload
 */
export const verifyTitleApproved = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    if (!projectId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing project ID'
      });
    }

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'approved') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Cannot upload files for project with ${project.status} title. Title must be approved first.`,
        projectStatus: project.status
      });
    }

    // Attach project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error('Error verifying title approval:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying title approval'
    });
  }
};

/**
 * Verify that the instructor is assigned to the project's student
 * Used to ensure instructors can only approve/reject/evaluate their assigned students' projects
 */
export const verifyInstructorProjectAccess = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const instructorId = req.user?.id;

    if (!projectId || !instructorId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing project ID or instructor ID'
      });
    }

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if instructor is assigned to the project's student
    const query = `
      SELECT 1 FROM instructor_student_assignments
      WHERE instructor_id = $1 AND student_id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [instructorId, project.student_id]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not assigned to this project\'s student'
      });
    }

    // Attach project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error('Error verifying instructor project access:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying instructor project access'
    });
  }
};

/**
 * Verify that the user is a department head and belongs to the correct department
 * Used to ensure department heads can only access their own department's data
 */
export const verifyDepartmentHeadAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (userRole !== 'department_head') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only department heads can access this resource'
      });
    }

    // Get department head's department
    const query = `
      SELECT u.department_id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND r.name = 'department_head'
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Department head record not found'
      });
    }

    // Attach department_id to request for use in controller
    req.departmentId = result.rows[0].department_id;
    next();
  } catch (error) {
    console.error('Error verifying department head access:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying department head access'
    });
  }
};

/**
 * Verify that the user is an instructor
 * Used to restrict endpoints to instructors only
 */
export const verifyInstructor = (req, res, next) => {
  const userRole = req.user?.role;

  if (userRole !== 'instructor') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Only instructors can access this resource'
    });
  }

  next();
};

/**
 * Verify that the user is a student
 * Used to restrict endpoints to students only
 */
export const verifyStudent = (req, res, next) => {
  const userRole = req.user?.role;

  if (userRole !== 'student') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Only students can access this resource'
    });
  }

  next();
};

/**
 * Verify tutorial file upload permissions
 * Only instructors assigned to the course and admins can upload
 */
export const verifyTutorialFileUploadPermission = async (req, res, next) => {
  try {
    const { tutorialId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Admin and super_admin have full access
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next();
    }

    // Department heads cannot upload files
    if (userRole === 'department_head') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Department heads can only view materials, not upload them. Only instructors can upload tutorial files.'
      });
    }

    // Only instructors can upload (besides admins)
    if (userRole !== 'instructor') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only instructors and admins can upload tutorial files'
      });
    }

    // Check if instructor is assigned to the tutorial's course
    const query = `
      SELECT t.course_id, ci.instructor_id
      FROM tutorials t
      LEFT JOIN course_instructors ci ON t.course_id = ci.course_id AND ci.is_active = true
      WHERE t.id = $1 AND ci.instructor_id = $2
    `;

    const result = await pool.query(query, [tutorialId, userId]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only upload files to tutorials for courses you are assigned to'
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying tutorial file upload permission:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying upload permissions'
    });
  }
};

/**
 * Verify course management permissions (Department Head only)
 * Department heads can manage courses but not tutorial materials
 */
export const verifyCourseManagementPermission = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Admin and super_admin have full access
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next();
    }

    // Only department heads can manage courses
    if (userRole !== 'department_head') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only department heads can manage courses'
      });
    }

    // Get department head's department
    const query = `
      SELECT department_id FROM users
      WHERE id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Department head record not found'
      });
    }

    // Attach department_id to request for use in controller
    req.departmentId = result.rows[0].department_id;
    next();
  } catch (error) {
    console.error('Error verifying course management permission:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying course management permissions'
    });
  }
};

/**
 * Verify tutorial material access permissions (SIMPLIFIED)
 * All authenticated users can view, but with different levels of access
 */
export const verifyTutorialMaterialAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { tutorialId } = req.params;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Admin and super_admin have full access
    if (userRole === 'admin' || userRole === 'super_admin') {
      req.accessLevel = 'full';
      return next();
    }

    // Check if tutorial exists
    const tutorialQuery = 'SELECT id, is_published FROM tutorials WHERE id = $1';
    const tutorialResult = await pool.query(tutorialQuery, [tutorialId]);

    if (tutorialResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Tutorial not found'
      });
    }

    const tutorial = tutorialResult.rows[0];

    // Set access level based on role
    if (userRole === 'instructor') {
      req.accessLevel = 'full';
      return next();
    } else if (userRole === 'student') {
      // Students have read-only access to published tutorials
      if (tutorial.is_published) {
        req.accessLevel = 'read_only';
        return next();
      } else {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'This tutorial is not published yet'
        });
      }
    } else if (userRole === 'department_head') {
      req.accessLevel = 'read_only';
      return next();
    }

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Insufficient permissions to access this tutorial'
    });

  } catch (error) {
    console.error('Error verifying tutorial material access:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying material access permissions'
    });
  }
};

/**
 * Verify that the user is not attempting to access another user's data
 * Used to prevent users from accessing other users' personal information
 */
export const verifySelfAccess = (req, res, next) => {
  const userId = req.user?.id;
  const targetUserId = parseInt(req.params.userId || req.body.userId);

  if (userId !== targetUserId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You do not have permission to access this user\'s data'
    });
  }

  next();
};
