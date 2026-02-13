/**
 * Evaluation Service
 * Business logic for evaluation operations
 */

import EvaluationModel from '../models/evaluation.model.js';
import ProjectModel from '../models/project.model.js';
import NotificationModel from '../models/notification.model.js';
import { ForbiddenError, ValidationError, NotFoundError } from '../utils/errors.js';

class EvaluationService {
  /**
   * Create evaluation with validation
   * Validates instructor assignment and project existence
   */
  static async createEvaluation(
    projectId,
    instructorId,
    evaluationType,
    score,
    feedback,
    recommendation,
    status
  ) {
    // Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found', { projectId });
    }

    // Verify instructor is assigned to the student
    const isAssigned = await ProjectModel.verifyInstructorAssignment(
      instructorId,
      project.student_id
    );
    if (!isAssigned) {
      throw new ForbiddenError(
        'Instructor is not assigned to this student',
        { instructorId, studentId: project.student_id }
      );
    }

    // Validate score range
    if (score < 0 || score > 100) {
      throw new ValidationError(
        'Evaluation score must be between 0 and 100',
        { field: 'score', value: score, min: 0, max: 100 }
      );
    }

    // Validate feedback length
    if (feedback.length < 10) {
      throw new ValidationError(
        'Feedback must be at least 10 characters',
        { field: 'feedback', minLength: 10, actualLength: feedback.length }
      );
    }

    // Validate recommendation is not empty
    if (!recommendation || recommendation.trim().length === 0) {
      throw new ValidationError(
        'Recommendation cannot be empty',
        { field: 'recommendation' }
      );
    }

    // Validate evaluation type
    const validTypes = ['proposal', 'project_progress', 'final_project', 'tutorial_assignment'];
    if (!validTypes.includes(evaluationType)) {
      throw new ValidationError(
        'Invalid evaluation type',
        { field: 'evaluation_type', value: evaluationType, validValues: validTypes }
      );
    }

    // Validate evaluation status
    const validStatuses = ['Approved', 'Needs Revision', 'Rejected'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        'Invalid evaluation status',
        { field: 'status', value: status, validValues: validStatuses }
      );
    }

    // Create evaluation
    const evaluation = await EvaluationModel.create({
      project_id: projectId,
      instructor_id: instructorId,
      evaluation_type: evaluationType,
      score,
      feedback,
      recommendation,
      status
    });

    // Create notification for student
    await NotificationModel.create({
      user_id: project.student_id,
      title: 'Project Evaluation Complete',
      message: `Your project has been evaluated. Type: ${evaluationType}, Status: ${status}`,
      type: 'evaluation_complete'
    });

    return evaluation;
  }

  /**
   * Get all evaluations for a student
   */
  static async getStudentEvaluations(studentId) {
    const evaluations = await EvaluationModel.findByStudent(studentId);
    return evaluations;
  }

  /**
   * Get evaluation summary for department head
   */
  static async getEvaluationSummary(departmentHeadId) {
    const summary = await EvaluationModel.findSummary();
    return summary;
  }

  /**
   * Verify instructor can evaluate project
   */
  static async verifyEvaluationPermission(instructorId, projectId) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return false;
    }

    const isAssigned = await ProjectModel.verifyInstructorAssignment(
      instructorId,
      project.student_id
    );
    return isAssigned;
  }

  /**
   * Get evaluation by ID
   */
  static async getEvaluationById(evaluationId) {
    const evaluation = await EvaluationModel.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found', { evaluationId });
    }
    return evaluation;
  }

  /**
   * Update evaluation
   */
  static async updateEvaluation(evaluationId, updateData) {
    const evaluation = await EvaluationModel.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found', { evaluationId });
    }

    // Validate score if provided
    if (updateData.score !== undefined) {
      if (updateData.score < 0 || updateData.score > 100) {
        throw new ValidationError(
          'Evaluation score must be between 0 and 100',
          { field: 'score', value: updateData.score, min: 0, max: 100 }
        );
      }
    }

    // Validate feedback if provided
    if (updateData.feedback !== undefined && updateData.feedback.length < 10) {
      throw new ValidationError(
        'Feedback must be at least 10 characters',
        { field: 'feedback', minLength: 10, actualLength: updateData.feedback.length }
      );
    }

    // Validate recommendation if provided
    if (updateData.recommendation !== undefined) {
      if (!updateData.recommendation || updateData.recommendation.trim().length === 0) {
        throw new ValidationError(
          'Recommendation cannot be empty',
          { field: 'recommendation' }
        );
      }
    }

    // Validate evaluation type if provided
    if (updateData.evaluation_type !== undefined) {
      const validTypes = ['proposal', 'project_progress', 'final_project', 'tutorial_assignment'];
      if (!validTypes.includes(updateData.evaluation_type)) {
        throw new ValidationError(
          'Invalid evaluation type',
          { field: 'evaluation_type', value: updateData.evaluation_type, validValues: validTypes }
        );
      }
    }

    // Validate status if provided
    if (updateData.status !== undefined) {
      const validStatuses = ['Approved', 'Needs Revision', 'Rejected'];
      if (!validStatuses.includes(updateData.status)) {
        throw new ValidationError(
          'Invalid evaluation status',
          { field: 'status', value: updateData.status, validValues: validStatuses }
        );
      }
    }

    const updatedEvaluation = await EvaluationModel.update(evaluationId, updateData);
    return updatedEvaluation;
  }

  /**
   * Delete evaluation
   */
  static async deleteEvaluation(evaluationId) {
    const evaluation = await EvaluationModel.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluation not found', { evaluationId });
    }

    await EvaluationModel.delete(evaluationId);
  }
}

export default EvaluationService;
