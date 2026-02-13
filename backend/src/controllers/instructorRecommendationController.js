/**
 * Instructor Recommendation Controller
 * Handles all instructor recommendation-related operations with RBAC
 */

import InstructorRecommendationModel from '../models/instructorRecommendation.model.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validationResult } from 'express-validator';

// ============================================
// CREATE RECOMMENDATION
// ============================================

export const createRecommendation = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const instructor_id = req.user.id;
    const {
      student_id,
      evaluation_id,
      recommendation_type,
      title,
      description,
      priority_level,
      status
    } = req.body;

    // Verify instructor has access to this student
    const hasAccess = await InstructorRecommendationModel.verifyInstructorAccess(instructor_id, student_id);
    if (!hasAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to create recommendations for this student'
      });
    }

    const recommendationData = {
      instructor_id,
      student_id,
      evaluation_id,
      recommendation_type,
      title,
      description,
      priority_level,
      status
    };

    const recommendation = await InstructorRecommendationModel.create(recommendationData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      recommendation,
      message: 'Recommendation created successfully'
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to create recommendation'
    });
  }
};

// ============================================
// GET RECOMMENDATIONS (INSTRUCTOR VIEW)
// ============================================

export const getRecommendations = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const filters = {
      student_id: req.query.student_id,
      recommendation_type: req.query.recommendation_type,
      status: req.query.status,
      priority_level: req.query.priority_level
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const recommendations = await InstructorRecommendationModel.findByInstructor(instructor_id, filters);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
};

// ============================================
// GET RECOMMENDATION BY ID
// ============================================

export const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.user.id;

    const recommendation = await InstructorRecommendationModel.findById(id);

    if (!recommendation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Verify ownership
    if (recommendation.instructor_id !== instructor_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Get recommendation by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch recommendation'
    });
  }
};

// ============================================
// UPDATE RECOMMENDATION
// ============================================

export const updateRecommendation = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const instructor_id = req.user.id;
    const updateData = req.body;

    const updatedRecommendation = await InstructorRecommendationModel.update(id, instructor_id, updateData);

    if (!updatedRecommendation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found or access denied'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      recommendation: updatedRecommendation,
      message: 'Recommendation updated successfully'
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to update recommendation'
    });
  }
};

// ============================================
// DELETE RECOMMENDATION
// ============================================

export const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.user.id;

    const deletedRecommendation = await InstructorRecommendationModel.delete(id, instructor_id);

    if (!deletedRecommendation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recommendation not found or access denied'
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
      message: 'Failed to delete recommendation'
    });
  }
};

// ============================================
// GET RECOMMENDATION STATISTICS
// ============================================

export const getRecommendationStatistics = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const statistics = await InstructorRecommendationModel.getStatistics(instructor_id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Get recommendation statistics error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch recommendation statistics'
    });
  }
};

// ============================================
// GET ASSIGNED STUDENTS FOR RECOMMENDATIONS
// ============================================

export const getAssignedStudentsForRecommendations = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    // First try to get students from instructor_student_assignments table
    let query = `
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        d.name as department_name,
        COUNT(ir.id) as recommendation_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      INNER JOIN instructor_student_assignments isa ON isa.student_id = u.id AND isa.instructor_id = $1 AND isa.is_active = true
      LEFT JOIN instructor_recommendations ir ON ir.student_id = u.id AND ir.instructor_id = $1
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
      GROUP BY u.id, u.full_name, u.email, d.name
      ORDER BY u.full_name
    `;

    const pool = (await import('../config/database.js')).default;
    
    try {
      const result = await pool.query(query, [instructor_id]);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        students: result.rows
      });
    } catch (error) {
      // If instructor_student_assignments table doesn't exist, fall back to course enrollments
      console.log('Falling back to course enrollments for student assignments');
      
      const fallbackQuery = `
        SELECT DISTINCT 
          u.id,
          u.full_name,
          u.email,
          d.name as department_name,
          COUNT(ir.id) as recommendation_count
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        INNER JOIN enrollments e ON e.student_id = u.id
        INNER JOIN courses c ON c.id = e.course_id AND c.instructor_id = $1
        LEFT JOIN instructor_recommendations ir ON ir.student_id = u.id AND ir.instructor_id = $1
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
        GROUP BY u.id, u.full_name, u.email, d.name
        ORDER BY u.full_name
      `;
      
      const fallbackResult = await pool.query(fallbackQuery, [instructor_id]);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        students: fallbackResult.rows
      });
    }
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Failed to fetch assigned students'
    });
  }
};

export default {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  updateRecommendation,
  deleteRecommendation,
  getRecommendationStatistics,
  getAssignedStudentsForRecommendations,
};