/**
 * Validators Index
 * Central export for all validation rules
 */

import userValidator from './user.validator.js';
import roleValidator from './role.validator.js';
import departmentValidator from './department.validator.js';
import courseValidator from './course.validator.js';
import evaluationValidator from './evaluation.validator.js';
import recommendationValidator from './recommendation.validator.js';
import feedbackValidator from './feedback.validator.js';
import progressValidator from './progress.validator.js';
import projectValidator from './project.validator.js';

// Named exports for individual validators
export {
  userValidator,
  roleValidator,
  departmentValidator,
  courseValidator,
  evaluationValidator,
  recommendationValidator,
  feedbackValidator,
  progressValidator,
  projectValidator,
};

// Default export with all validators
export default {
  user: userValidator,
  role: roleValidator,
  department: departmentValidator,
  course: courseValidator,
  evaluation: evaluationValidator,
  recommendation: recommendationValidator,
  feedback: feedbackValidator,
  progress: progressValidator,
  project: projectValidator,
};
