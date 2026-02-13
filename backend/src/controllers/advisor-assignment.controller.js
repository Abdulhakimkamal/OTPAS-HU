/**
 * Advisor Assignment Controller
 * HTTP request handlers for project advisor assignment operations
 */

import AdvisorAssignmentService from '../services/advisor-assignment.service.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class AdvisorAssignmentController {
  /**
   * Assign instructor as project advisor
   * POST /api/department-head/projects/:projectId/assign-advisor
   */
  static async assignAdvisor(req, res, next) {
    try {
      const departmentHeadId = req.user.id;
      const projectId = parseInt(req.params.projectId, 10);
      const { advisorId } = req.body;

      // Validation
      if (!projectId || isNaN(projectId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      if (!advisorId || isNaN(parseInt(advisorId, 10))) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid advisor ID'
        });
      }

      const project = await AdvisorAssignmentService.assignAdvisor(
        projectId,
        parseInt(advisorId, 10),
        departmentHeadId
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project advisor assigned successfully',
        data: project
      });
    } catch (error) {
      if (error.message.includes('not found') || 
          error.message.includes('not an instructor') ||
          error.message.includes('same department') ||
          error.message.includes('already assigned')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get available instructors for advising
   * GET /api/department-head/instructors
   */
  static async getAvailableInstructors(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const instructors = await AdvisorAssignmentService.getAvailableInstructors(departmentHeadId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Available instructors retrieved successfully',
        data: instructors,
        count: instructors.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get projects without assigned advisors
   * GET /api/department-head/projects/unassigned
   */
  static async getUnassignedProjects(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const projects = await AdvisorAssignmentService.getUnassignedProjects(departmentHeadId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Unassigned projects retrieved successfully',
        data: projects,
        count: projects.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all projects with advisor information
   * GET /api/department-head/projects/with-advisors
   */
  static async getProjectsWithAdvisors(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const projects = await AdvisorAssignmentService.getProjectsWithAdvisors(departmentHeadId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Projects with advisors retrieved successfully',
        data: projects,
        count: projects.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove advisor assignment from project
   * DELETE /api/department-head/projects/:projectId/remove-advisor
   */
  static async removeAdvisor(req, res, next) {
    try {
      const departmentHeadId = req.user.id;
      const projectId = parseInt(req.params.projectId, 10);

      if (!projectId || isNaN(projectId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const project = await AdvisorAssignmentService.removeAdvisor(projectId, departmentHeadId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project advisor removed successfully',
        data: project
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('No advisor')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

export default AdvisorAssignmentController;
