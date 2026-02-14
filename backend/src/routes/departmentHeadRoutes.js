import express from 'express';
import DepartmentHeadController from '../controllers/department-head.controller.js';
import EvaluationController from '../controllers/evaluation.controller.js';
import AdvisorAssignmentController from '../controllers/advisor-assignment.controller.js';
import CourseManagementController from '../controllers/course-management.controller.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { verifyDepartmentHeadAccess, verifyCourseManagementPermission } from '../middleware/authorization.js';
import studentValidator from '../validators/student.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(verifyToken);
router.use(authorize('department_head'));

// ============================================
// STUDENT MANAGEMENT
// ============================================
// STUDENT PROGRESS (must be before /students/:id)
router.get('/students/progress', DepartmentHeadController.getStudentProgress);

router.get('/students', 
  studentValidator.searchStudentsValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.post('/students', 
  studentValidator.createStudentValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.get('/students/:id',
  studentValidator.getStudentValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.put('/students/:id', 
  studentValidator.updateStudentValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.patch('/students/:id/status',
  studentValidator.updateStudentStatusValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.patch('/students/:id/reset-password',
  studentValidator.resetStudentPasswordValidation,
  validateRequest,
  DepartmentHeadController.getStudentProgress
);

router.get('/progress/:studentId', DepartmentHeadController.getStudentProgress);

// ============================================
// COURSE MANAGEMENT (ENHANCED WITH RBAC)
// ============================================
// Department Head can manage courses but NOT tutorial materials
router.get('/courses', verifyCourseManagementPermission, CourseManagementController.getDepartmentCourses);
router.post('/courses', verifyCourseManagementPermission, CourseManagementController.registerCourse);
router.put('/courses/:courseId', verifyCourseManagementPermission, CourseManagementController.updateCourse);
router.post('/courses/assign-instructor', verifyCourseManagementPermission, CourseManagementController.assignInstructorToCourse);
router.get('/instructors/available', verifyCourseManagementPermission, CourseManagementController.getAvailableInstructors);

// Course materials monitoring (READ-ONLY for Department Head)
router.get('/course-materials/dashboard', verifyCourseManagementPermission, CourseManagementController.getCourseMaterialsDashboard);

// Legacy course routes (kept for backward compatibility)
// These routes are deprecated - use new course management endpoints above

// ============================================
// INSTRUCTOR MANAGEMENT
// ============================================
// Note: /instructors route moved to advisor assignment section

// ============================================
// PROJECT ADVISOR ASSIGNMENT (NEW)
// ============================================
router.get('/instructors', AdvisorAssignmentController.getAvailableInstructors);
router.get('/projects/unassigned', AdvisorAssignmentController.getUnassignedProjects);
router.get('/projects/with-advisors', AdvisorAssignmentController.getProjectsWithAdvisors);
router.post('/projects/:projectId/assign-advisor', AdvisorAssignmentController.assignAdvisor);
router.delete('/projects/:projectId/remove-advisor', AdvisorAssignmentController.removeAdvisor);

// ============================================
// EVALUATION ANALYTICS (Department Head Oversight)
// ============================================
router.get('/evaluation-analytics', DepartmentHeadController.getEvaluationStatistics);
router.get('/course-performance-comparison', DepartmentHeadController.getEvaluationStatisticsByType);
router.get('/instructor-performance-comparison', DepartmentHeadController.getInstructorPerformance);

// ============================================
// EVALUATION (ACADEMIC EVALUATION WORKFLOW)
// ============================================
router.get('/evaluations/summary', EvaluationController.getEvaluationSummary);

// ============================================
// ACADEMIC EVALUATION MONITORING (NEW)
// ============================================
router.get('/dashboard', verifyDepartmentHeadAccess, DepartmentHeadController.getDashboardSummary);
router.get('/evaluations/summary', verifyDepartmentHeadAccess, DepartmentHeadController.getEvaluationSummary);
router.get('/projects/overview', verifyDepartmentHeadAccess, DepartmentHeadController.getProjectOverview);
router.get('/statistics/evaluations', verifyDepartmentHeadAccess, DepartmentHeadController.getEvaluationStatistics);
router.get('/statistics/evaluations/by-type', verifyDepartmentHeadAccess, DepartmentHeadController.getEvaluationStatisticsByType);
router.get('/statistics/projects/by-status', verifyDepartmentHeadAccess, DepartmentHeadController.getProjectStatisticsByStatus);
router.get('/performance/instructors', verifyDepartmentHeadAccess, DepartmentHeadController.getInstructorPerformance);
router.get('/progress/students', verifyDepartmentHeadAccess, DepartmentHeadController.getStudentProgress);
router.get('/activity/recent', verifyDepartmentHeadAccess, DepartmentHeadController.getRecentActivity);

// Legacy evaluation endpoints (kept for backward compatibility)
// These routes are deprecated - use new evaluation monitoring endpoints above

// ============================================
// REPORTING
// ============================================
// Reporting endpoints deprecated - use analytics endpoints above

// ============================================
// RECOMMENDATION ENGINE
// ============================================
router.get('/recommend/risk-students', verifyDepartmentHeadAccess, DepartmentHeadController.getRiskStudents);

// Recommendation endpoints deprecated - use analytics endpoints above

// ============================================
// FEEDBACK
// ============================================
// Feedback endpoints deprecated

// ============================================
// PROFILE MANAGEMENT
// ============================================
// Profile endpoints deprecated

// ============================================
// CHANGE PASSWORD
// ============================================
// Change password endpoints deprecated

// ============================================
// LEGACY ROUTES (Backward compatibility)
// ============================================
// These routes are deprecated - use new endpoints above

export default router;
