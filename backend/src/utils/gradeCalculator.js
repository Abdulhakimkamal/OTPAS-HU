/**
 * Grade Calculator Utility
 * Provides automatic grade calculation based on numeric scores
 * Following standard academic grading scale
 */

/**
 * Calculate letter grade from numeric score
 * @param {number} score - Numeric score (0-100)
 * @returns {string} Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)
 * @throws {Error} If score is invalid
 */
export const calculateGrade = (score) => {
  // Validate input
  if (typeof score !== 'number' || isNaN(score)) {
    throw new Error('Score must be a valid number');
  }

  if (score < 0 || score > 100) {
    throw new Error('Score must be between 0 and 100');
  }

  // Grade calculation based on standard scale
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 45) return 'C-';
  if (score >= 40) return 'D';
  return 'F';
};

/**
 * Get grade point average (GPA) value for a letter grade
 * @param {string} grade - Letter grade
 * @returns {number} GPA value (0.0 - 4.0 scale)
 */
export const getGradePoints = (grade) => {
  const gradePoints = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0
  };

  return gradePoints[grade] || 0.0;
};

/**
 * Get grade color for UI display
 * @param {string} grade - Letter grade
 * @returns {string} CSS color class
 */
export const getGradeColor = (grade) => {
  if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-600';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600';
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600';
  if (grade === 'D') return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get grade description
 * @param {string} grade - Letter grade
 * @returns {string} Grade description
 */
export const getGradeDescription = (grade) => {
  const descriptions = {
    'A+': 'Excellent',
    'A': 'Excellent',
    'A-': 'Very Good',
    'B+': 'Good',
    'B': 'Good',
    'B-': 'Above Average',
    'C+': 'Average',
    'C': 'Average',
    'C-': 'Below Average',
    'D': 'Poor',
    'F': 'Fail'
  };

  return descriptions[grade] || 'Unknown';
};

/**
 * Validate score input
 * @param {any} score - Score to validate
 * @returns {object} Validation result
 */
export const validateScore = (score) => {
  const errors = [];

  if (score === null || score === undefined || score === '') {
    errors.push('Score is required');
    return { isValid: false, errors };
  }

  const numericScore = parseFloat(score);

  if (isNaN(numericScore)) {
    errors.push('Score must be a valid number');
    return { isValid: false, errors };
  }

  if (numericScore < 0) {
    errors.push('Score cannot be negative');
  }

  if (numericScore > 100) {
    errors.push('Score cannot exceed 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: numericScore
  };
};

/**
 * Get grade statistics for a set of scores
 * @param {number[]} scores - Array of numeric scores
 * @returns {object} Grade statistics
 */
export const getGradeStatistics = (scores) => {
  if (!Array.isArray(scores) || scores.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      distribution: {}
    };
  }

  const validScores = scores.filter(score => typeof score === 'number' && !isNaN(score));
  const grades = validScores.map(score => calculateGrade(score));
  
  const distribution = grades.reduce((acc, grade) => {
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  return {
    total: validScores.length,
    average: validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
    highest: Math.max(...validScores),
    lowest: Math.min(...validScores),
    distribution
  };
};

/**
 * Calculate cumulative total score for a student in a course
 * @param {number} studentId - Student ID
 * @param {number} courseId - Course ID
 * @param {object} pool - Database pool
 * @returns {Promise<object>} Cumulative score breakdown and total
 */
export const calculateCumulativeScore = async (studentId, courseId, pool) => {
  try {
    const query = `
      SELECT 
        evaluation_type,
        SUM(score) as total_score
      FROM course_evaluations 
      WHERE student_id = $1 AND course_id = $2
      GROUP BY evaluation_type
    `;
    
    const result = await pool.query(query, [studentId, courseId]);
    
    const breakdown = {
      mid_exam: 0,
      final_exam: 0,
      project: 0,
      quiz: 0
    };
    
    // Sum scores by evaluation type
    result.rows.forEach(row => {
      if (breakdown.hasOwnProperty(row.evaluation_type)) {
        breakdown[row.evaluation_type] = parseFloat(row.total_score) || 0;
      }
    });
    
    // Calculate total (max 100)
    const totalScore = breakdown.mid_exam + breakdown.final_exam + breakdown.project + breakdown.quiz;
    
    return {
      breakdown,
      totalScore: Math.min(totalScore, 100),
      maxPossible: 100
    };
  } catch (error) {
    console.error('Calculate cumulative score error:', error);
    return {
      breakdown: { mid_exam: 0, final_exam: 0, project: 0, quiz: 0 },
      totalScore: 0,
      maxPossible: 100
    };
  }
};

/**
 * Validate score based on evaluation type
 * @param {number} score - Numeric score
 * @param {string} evaluationType - Type of evaluation
 * @returns {object} Validation result
 */
export const validateScoreForEvaluationType = (score, evaluationType) => {
  const errors = [];
  
  if (typeof score !== 'number' || isNaN(score)) {
    errors.push('Score must be a valid number');
    return { isValid: false, errors };
  }

  if (score < 0) {
    errors.push('Score cannot be negative');
  }

  // Evaluation type specific limits
  let maxScore = 100; // default
  switch (evaluationType) {
    case 'mid_exam':
      maxScore = 30;
      break;
    case 'final_exam':
      maxScore = 50;
      break;
    case 'project':
      maxScore = 15;
      break;
    case 'quiz':
      maxScore = 5;
      break;
  }

  if (score > maxScore) {
    errors.push(`Score cannot exceed ${maxScore} for ${evaluationType.replace('_', ' ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    maxScore
  };
};

export default {
  calculateGrade,
  calculateCumulativeScore,
  getGradePoints,
  getGradeColor,
  getGradeDescription,
  validateScore,
  validateScoreForEvaluationType,
  getGradeStatistics
};