/**
 * Department Head Controller
 * Handles HTTP requests for department head monitoring and read-only access
 * Requirements: 6.11, 6.12, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import DepartmentHeadService from '../services/department-head.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { handleError } from '../utils/errors.js';

class DepartmentHeadController {
  /**
   * Get evaluation summary
   * GET /api/department-head/evaluations/summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getEvaluationSummary(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const evaluations = await DepartmentHeadService.getEvaluationSummary(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation summary retrieved successfully',
        data: evaluations,
        count: evaluations.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get project overview
   * GET /api/department-head/projects/overview
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProjectOverview(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const projects = await DepartmentHeadService.getProjectOverview(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project overview retrieved successfully',
        data: projects,
        count: projects.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get evaluation statistics
   * GET /api/department-head/statistics/evaluations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getEvaluationStatistics(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const stats = await DepartmentHeadService.getEvaluationStatistics(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get evaluation statistics by type
   * GET /api/department-head/statistics/evaluations/by-type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getEvaluationStatisticsByType(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const stats = await DepartmentHeadService.getEvaluationStatisticsByType(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation statistics by type retrieved successfully',
        data: stats,
        count: stats.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get project statistics by status
   * GET /api/department-head/statistics/projects/by-status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getProjectStatisticsByStatus(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const stats = await DepartmentHeadService.getProjectStatisticsByStatus(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project statistics by status retrieved successfully',
        data: stats,
        count: stats.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get instructor performance
   * GET /api/department-head/performance/instructors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getInstructorPerformance(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const performance = await DepartmentHeadService.getInstructorPerformance(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Instructor performance retrieved successfully',
        data: performance,
        count: performance.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get student progress
   * GET /api/department-head/progress/students
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getStudentProgress(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const progress = await DepartmentHeadService.getStudentProgress(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Student progress retrieved successfully',
        data: progress,
        count: progress.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get recent activity
   * GET /api/department-head/activity/recent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getRecentActivity(req, res, next) {
    try {
      const departmentHeadId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;

      // Validate limit
      if (limit < 1 || limit > 100) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const activity = await DepartmentHeadService.getRecentActivity(departmentHeadId, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: activity,
        count: activity.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get at-risk students
   * GET /api/department-head/recommend/risk-students
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getRiskStudents(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const riskStudents = await DepartmentHeadService.getRiskStudents(departmentHeadId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'At-risk students retrieved successfully',
        data: riskStudents,
        count: riskStudents.length
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }

  /**
   * Get dashboard summary
   * GET /api/department-head/dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDashboardSummary(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      // Get all data in parallel
      const [stats, evalByType, projByStatus, instructorPerf, recentActivity] = await Promise.all([
        DepartmentHeadService.getEvaluationStatistics(departmentHeadId),
        DepartmentHeadService.getEvaluationStatisticsByType(departmentHeadId),
        DepartmentHeadService.getProjectStatisticsByStatus(departmentHeadId),
        DepartmentHeadService.getInstructorPerformance(departmentHeadId),
        DepartmentHeadService.getRecentActivity(departmentHeadId, 10)
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Dashboard summary retrieved successfully',
        data: {
          statistics: stats,
          evaluations_by_type: evalByType,
          projects_by_status: projByStatus,
          top_instructors: instructorPerf.slice(0, 5),
          recent_activity: recentActivity
        }
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }
}

export default DepartmentHeadController;
