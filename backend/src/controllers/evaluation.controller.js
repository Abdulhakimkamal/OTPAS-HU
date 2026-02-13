/**
 * Evaluation Controller
 * HTTP request handlers for evaluation operations
 */

import { validationResult } from 'express-validator';
import EvaluationService from '../services/evaluation.service.js';
import { HTTP_STATUS } from '../config/constants.js';

class EvaluationController {
  /**
   * Create evaluation
   * POST /api/instructor/evaluation/create
   */
  static async createEvaluation(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const {
        project_id,
        evaluation_type,
        score,
        feedback,
        recommendation,
        status
      } = req.body;

      const instructorId = req.user.id;

      const evaluation = await EvaluationService.createEvaluation(
        project_id,
        instructorId,
        evaluation_type,
        score,
        feedback,
        recommendation,
        status
      );

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Evaluation created successfully',
        data: evaluation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluations for student
   * GET /api/student/evaluations
   */
  static async getEvaluations(req, res, next) {
    try {
      const studentId = req.user.id;

      const evaluations = await EvaluationService.getStudentEvaluations(studentId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluations retrieved successfully',
        data: evaluations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluation summary for department head
   * GET /api/department-head/evaluations/summary
   */
  static async getEvaluationSummary(req, res, next) {
    try {
      const departmentHeadId = req.user.id;

      const summary = await EvaluationService.getEvaluationSummary(departmentHeadId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluation by ID
   * GET /api/instructor/evaluation/:id
   */
  static async getEvaluationById(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const evaluation = await EvaluationService.getEvaluationById(id);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation retrieved successfully',
        data: evaluation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update evaluation
   * PATCH /api/instructor/evaluation/:id
   */
  static async updateEvaluation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const evaluation = await EvaluationService.updateEvaluation(id, updateData);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation updated successfully',
        data: evaluation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete evaluation
   * DELETE /api/instructor/evaluation/:id
   */
  static async deleteEvaluation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;

      await EvaluationService.deleteEvaluation(id);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default EvaluationController;
