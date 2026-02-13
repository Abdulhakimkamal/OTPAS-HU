import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { verifyToken, authorize, isAdminOrSuperAdmin } from '../middleware/auth.js';
import { 
  userValidator, 
  departmentValidator, 
  recommendationValidator,
  progressValidator 
} from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All admin routes require authentication
router.use(verifyToken);

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/overview', isAdminOrSuperAdmin, adminController.getDashboardOverview);

// ============================================
// USER MANAGEMENT
// ============================================
router.get('/users', isAdminOrSuperAdmin, adminController.getAllUsers);

router.post('/users', 
  isAdminOrSuperAdmin, 
  userValidator.createUserValidation,
  validateRequest,
  adminController.createUser
);

router.post('/users/create', 
  isAdminOrSuperAdmin,
  adminController.createUserFullStack
);

router.post('/users/instructor', 
  isAdminOrSuperAdmin,
  userValidator.createUserValidation,
  validateRequest,
  adminController.createInstructor
);

router.post('/users/department-head', 
  isAdminOrSuperAdmin,
  userValidator.createUserValidation,
  validateRequest,
  adminController.createDepartmentHead
);

router.put('/users/:id', 
  isAdminOrSuperAdmin,
  userValidator.updateUserValidation,
  validateRequest,
  adminController.updateUser
);

router.post('/users/:id/reset-password', 
  isAdminOrSuperAdmin,
  userValidator.getUserByIdValidation,
  validateRequest,
  adminController.resetUserPassword
);

router.delete('/users/:id', 
  isAdminOrSuperAdmin,
  userValidator.deleteUserValidation,
  validateRequest,
  adminController.deleteUser
);

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================
router.get('/departments', isAdminOrSuperAdmin, adminController.getAllDepartments);

router.post('/departments', 
  isAdminOrSuperAdmin,
  departmentValidator.createDepartmentValidation,
  validateRequest,
  adminController.createDepartment
);

router.put('/departments/:id', 
  isAdminOrSuperAdmin,
  departmentValidator.updateDepartmentValidation,
  validateRequest,
  adminController.updateDepartment
);

router.delete('/departments/:id', 
  isAdminOrSuperAdmin,
  departmentValidator.deleteDepartmentValidation,
  validateRequest,
  adminController.deleteDepartment
);

// ============================================
// STUDENT PROGRESS TRACKING
// ============================================
router.get('/student-progress', isAdminOrSuperAdmin, adminController.getStudentProgress);

router.get('/student-progress/:student_id', 
  isAdminOrSuperAdmin,
  progressValidator.getProgressByIdValidation,
  validateRequest,
  adminController.getStudentDetailedProgress
);

// ============================================
// RECOMMENDATION ENGINE
// ============================================
router.get('/recommendations', isAdminOrSuperAdmin, adminController.getRecommendations);

router.post('/recommendations', 
  isAdminOrSuperAdmin,
  recommendationValidator.createRecommendationValidation,
  validateRequest,
  adminController.createRecommendation
);

router.put('/recommendations/:recommendation_id/status', 
  isAdminOrSuperAdmin,
  recommendationValidator.updateRecommendationValidation,
  validateRequest,
  adminController.updateRecommendationStatus
);

router.delete('/recommendations/:recommendation_id', 
  isAdminOrSuperAdmin,
  recommendationValidator.deleteRecommendationValidation,
  validateRequest,
  adminController.deleteRecommendation
);

// ============================================
// MONITORING & REPORTS
// ============================================
router.get('/reports/system', isAdminOrSuperAdmin, adminController.getSystemReports);
router.get('/reports/login-history', isAdminOrSuperAdmin, adminController.getLoginHistory);
router.get('/reports/activity-logs', isAdminOrSuperAdmin, adminController.getActivityLogs);

// ============================================
// PROJECT MANAGEMENT
// ============================================
router.post('/projects/:project_id/approve', isAdminOrSuperAdmin, adminController.approveProject);
router.post('/projects/:project_id/reject', isAdminOrSuperAdmin, adminController.rejectProject);

// ============================================
// SYSTEM SETTINGS
// ============================================
router.get('/settings', isAdminOrSuperAdmin, adminController.getSystemSettings);
router.put('/settings', isAdminOrSuperAdmin, adminController.updateSystemSettings);
router.get('/settings/:key', isAdminOrSuperAdmin, adminController.getSingleSetting);

export default router;
