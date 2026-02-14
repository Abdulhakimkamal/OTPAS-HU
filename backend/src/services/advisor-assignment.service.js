/**
 * Advisor Assignment Service
 * Handles business logic for assigning instructors as project advisors
 */

import pool from '../config/database.js';
import NotificationModel from '../models/notification.model.js';

class AdvisorAssignmentService {
  /**
   * Assign an instructor as project advisor
   * @param {number} projectId - Project ID
   * @param {number} advisorId - Instructor ID to assign as advisor
   * @param {number} departmentHeadId - Department head making the assignment
   * @returns {Promise<Object>} Updated project with advisor info
   */
  static async assignAdvisor(projectId, advisorId, departmentHeadId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verify project exists
      const projectQuery = await client.query(
        `SELECT p.*, u.department_id as student_department_id, u.full_name as student_name
         FROM projects p
         JOIN users u ON p.student_id = u.id
         WHERE p.id = $1`,
        [projectId]
      );

      if (projectQuery.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectQuery.rows[0];

      // 2. Verify instructor exists and get their department
      const instructorQuery = await client.query(
        `SELECT u.id, u.full_name, u.department_id, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [advisorId]
      );

      if (instructorQuery.rows.length === 0) {
        throw new Error('Instructor not found');
      }

      const instructor = instructorQuery.rows[0];

      // 3. Verify user is an instructor
      if (instructor.role_name !== 'instructor') {
        throw new Error('Selected user is not an instructor');
      }

      // 4. Verify department match
      if (instructor.department_id !== project.student_department_id) {
        throw new Error('Instructor must belong to the same department as the student');
      }

      // 5. Check if advisor is already assigned
      if (project.advisor_id === advisorId) {
        throw new Error('This instructor is already assigned as the project advisor');
      }

      // 6. Update project with advisor assignment
      const updateQuery = await client.query(
        `UPDATE projects
         SET advisor_id = $1, assigned_by = $2, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [advisorId, departmentHeadId, projectId]
      );

      const updatedProject = updateQuery.rows[0];

      // 7. Create notification for instructor
      await NotificationModel.create({
        user_id: advisorId,
        title: 'Project Advisor Assignment',
        message: `You have been assigned as project advisor for "${project.title}" by ${project.student_name}`,
        type: 'advisor_assigned'
      });

      // 8. Create notification for student
      await NotificationModel.create({
        user_id: project.student_id,
        title: 'Project Advisor Assigned',
        message: `${instructor.full_name} has been assigned as your project advisor`,
        type: 'advisor_assigned'
      });

      await client.query('COMMIT');

      // Return project with advisor details
      return {
        ...updatedProject,
        advisor_name: instructor.full_name,
        student_name: project.student_name
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get available instructors for advising (same department as dept head)
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} List of available instructors
   */
  static async getAvailableInstructors(departmentHeadId) {
    try {
      // Get department head's department
      const deptHeadQuery = await pool.query(
        'SELECT department_id FROM users WHERE id = $1',
        [departmentHeadId]
      );

      if (deptHeadQuery.rows.length === 0) {
        throw new Error('Department head not found');
      }

      const departmentId = deptHeadQuery.rows[0].department_id;

      // Get all instructors in the same department
      const query = `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.username,
          d.name as department_name,
          COALESCE(COUNT(DISTINCT p.id), 0) as advised_projects_count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN projects p ON p.advisor_id = u.id
        WHERE r.name = 'instructor' 
          AND u.department_id = $1
          AND u.is_active = true
        GROUP BY u.id, u.full_name, u.email, u.username, d.name
        ORDER BY advised_projects_count ASC, u.full_name ASC
      `;

      const result = await pool.query(query, [departmentId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getAvailableInstructors:', error.message);
      return [];
    }
  }

  /**
   * Get projects without assigned advisors (in dept head's department)
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} List of unassigned projects
   */
  static async getUnassignedProjects(departmentHeadId) {
    try {
      // Get department head's department
      const deptHeadQuery = await pool.query(
        'SELECT department_id FROM users WHERE id = $1',
        [departmentHeadId]
      );

      if (deptHeadQuery.rows.length === 0) {
        throw new Error('Department head not found');
      }

      const departmentId = deptHeadQuery.rows[0].department_id;

      // Get projects without advisors in the department
      const query = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.status,
          p.submitted_at,
          p.approved_at,
          p.student_id,
          u.full_name as student_name,
          u.email as student_email,
          p.instructor_id,
          i.full_name as instructor_name,
          COALESCE(COUNT(DISTINCT e.id), 0) as evaluation_count
        FROM projects p
        JOIN users u ON p.student_id = u.id
        LEFT JOIN users i ON p.instructor_id = i.id
        LEFT JOIN evaluations e ON p.id = e.project_id
        WHERE p.advisor_id IS NULL
          AND u.department_id = $1
          AND p.status IN ('draft', 'submitted', 'approved')
        GROUP BY p.id, p.title, p.description, p.status, p.submitted_at, p.approved_at,
                 p.student_id, u.full_name, u.email, p.instructor_id, i.full_name
        ORDER BY p.submitted_at DESC NULLS LAST
      `;

      const result = await pool.query(query, [departmentId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getUnassignedProjects:', error.message);
      return [];
    }
  }

  /**
   * Get all projects with advisor assignments (in dept head's department)
   * @param {number} departmentHeadId - Department head ID
   * @returns {Promise<Array>} List of projects with advisor info
   */
  static async getProjectsWithAdvisors(departmentHeadId) {
    try {
      // Get department head's department
      const deptHeadQuery = await pool.query(
        'SELECT department_id FROM users WHERE id = $1',
        [departmentHeadId]
      );

      if (deptHeadQuery.rows.length === 0) {
        throw new Error('Department head not found');
      }

      const departmentId = deptHeadQuery.rows[0].department_id;

      // Get all projects with advisor information
      const query = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.status,
          p.submitted_at,
          p.approved_at,
          p.student_id,
          u.full_name as student_name,
          u.email as student_email,
          p.instructor_id,
          i.full_name as instructor_name,
          p.advisor_id,
          a.full_name as advisor_name,
          p.assigned_by,
          ab.full_name as assigned_by_name,
          p.assigned_at,
          COALESCE(COUNT(DISTINCT e.id), 0) as evaluation_count
        FROM projects p
        JOIN users u ON p.student_id = u.id
        LEFT JOIN users i ON p.instructor_id = i.id
        LEFT JOIN users a ON p.advisor_id = a.id
        LEFT JOIN users ab ON p.assigned_by = ab.id
        LEFT JOIN evaluations e ON p.id = e.project_id
        WHERE u.department_id = $1
        GROUP BY p.id, p.title, p.description, p.status, p.submitted_at, p.approved_at,
                 p.student_id, u.full_name, u.email, p.instructor_id, i.full_name,
                 p.advisor_id, a.full_name, p.assigned_by, ab.full_name, p.assigned_at
        ORDER BY p.submitted_at DESC NULLS LAST
      `;

      const result = await pool.query(query, [departmentId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getProjectsWithAdvisors:', error.message);
      return [];
    }
  }

  /**
   * Remove advisor assignment from a project
   * @param {number} projectId - Project ID
   * @param {number} departmentHeadId - Department head removing the assignment
   * @returns {Promise<Object>} Updated project
   */
  static async removeAdvisor(projectId, departmentHeadId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get project and advisor info before removing
      const projectQuery = await client.query(
        `SELECT p.*, u.full_name as student_name, a.full_name as advisor_name, p.advisor_id
         FROM projects p
         JOIN users u ON p.student_id = u.id
         LEFT JOIN users a ON p.advisor_id = a.id
         WHERE p.id = $1`,
        [projectId]
      );

      if (projectQuery.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectQuery.rows[0];

      if (!project.advisor_id) {
        throw new Error('No advisor assigned to this project');
      }

      // Remove advisor assignment
      const updateQuery = await client.query(
        `UPDATE projects
         SET advisor_id = NULL, assigned_by = NULL, assigned_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [projectId]
      );

      // Notify the instructor
      await NotificationModel.create({
        user_id: project.advisor_id,
        title: 'Project Advisor Removed',
        message: `You have been removed as project advisor for "${project.title}"`,
        type: 'advisor_removed'
      });

      // Notify the student
      await NotificationModel.create({
        user_id: project.student_id,
        title: 'Project Advisor Removed',
        message: `${project.advisor_name} has been removed as your project advisor`,
        type: 'advisor_removed'
      });

      await client.query('COMMIT');

      return updateQuery.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default AdvisorAssignmentService;
