/**
 * Frontend Grade Calculator Utility
 * Provides client-side grade calculation and validation
 */

export interface GradeInfo {
  grade: string;
  color: string;
  description: string;
  gpa: number;
}

/**
 * Calculate letter grade from numeric score
 * @param score - Numeric score (0-100) - can be string or number
 * @returns Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)
 */
export const calculateGrade = (score: number | string): string => {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (typeof numericScore !== 'number' || isNaN(numericScore)) {
    return 'F';
  }

  if (numericScore >= 90) return 'A+';
  if (numericScore >= 85) return 'A';
  if (numericScore >= 80) return 'A-';
  if (numericScore >= 75) return 'B+';
  if (numericScore >= 70) return 'B';
  if (numericScore >= 65) return 'B-';
  if (numericScore >= 60) return 'C+';
  if (numericScore >= 50) return 'C';
  if (numericScore >= 45) return 'C-';
  if (numericScore >= 40) return 'D';
  return 'F';
};

/**
 * Get comprehensive grade information
 * @param score - Numeric score (can be string or number)
 * @returns Grade information object
 */
export const getGradeInfo = (score: number | string): GradeInfo => {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  const grade = calculateGrade(numericScore);
  
  return {
    grade,
    color: getGradeColor(grade),
    description: getGradeDescription(grade),
    gpa: getGradePoints(grade)
  };
};

/**
 * Get CSS color class for grade
 * @param grade - Letter grade
 * @returns CSS color class
 */
export const getGradeColor = (grade: string): string => {
  if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-600';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600';
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600';
  if (grade === 'D') return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get background color class for grade badge
 * @param grade - Letter grade
 * @returns CSS background color class
 */
export const getGradeBgColor = (grade: string): string => {
  if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 text-green-800';
  if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800';
  if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
  if (grade === 'D') return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

/**
 * Get grade description
 * @param grade - Letter grade
 * @returns Grade description
 */
export const getGradeDescription = (grade: string): string => {
  const descriptions: Record<string, string> = {
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
 * Get GPA points for grade
 * @param grade - Letter grade
 * @returns GPA points (0.0 - 4.0)
 */
export const getGradePoints = (grade: string): number => {
  const gradePoints: Record<string, number> = {
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
 * Validate score input
 * @param score - Score to validate
 * @returns Validation result
 */
export const validateScore = (score: any): { isValid: boolean; errors: string[]; score?: number } => {
  const errors: string[] = [];

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
 * Format score for display
 * @param score - Numeric score (can be string or number)
 * @returns Formatted score string
 */
export const formatScore = (score: number | string): string => {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (typeof numericScore !== 'number' || isNaN(numericScore)) {
    return '0.0';
  }
  
  return numericScore % 1 === 0 ? numericScore.toString() : numericScore.toFixed(1);
};

/**
 * Get grade scale information
 * @returns Array of grade scale ranges
 */
export const getGradeScale = () => [
  { grade: 'A+', range: '90 - 100', color: 'text-green-600', description: 'Excellent' },
  { grade: 'A', range: '85 - 89.99', color: 'text-green-600', description: 'Excellent' },
  { grade: 'A-', range: '80 - 84.99', color: 'text-green-600', description: 'Very Good' },
  { grade: 'B+', range: '75 - 79.99', color: 'text-blue-600', description: 'Good' },
  { grade: 'B', range: '70 - 74.99', color: 'text-blue-600', description: 'Good' },
  { grade: 'B-', range: '65 - 69.99', color: 'text-blue-600', description: 'Above Average' },
  { grade: 'C+', range: '60 - 64.99', color: 'text-yellow-600', description: 'Average' },
  { grade: 'C', range: '50 - 59.99', color: 'text-yellow-600', description: 'Average' },
  { grade: 'C-', range: '45 - 49.99', color: 'text-yellow-600', description: 'Below Average' },
  { grade: 'D', range: '40 - 44.99', color: 'text-orange-600', description: 'Poor' },
  { grade: 'F', range: '0 - 39.99', color: 'text-red-600', description: 'Fail' }
];

export default {
  calculateGrade,
  getGradeInfo,
  getGradeColor,
  getGradeBgColor,
  getGradeDescription,
  getGradePoints,
  validateScore,
  formatScore,
  getGradeScale
};