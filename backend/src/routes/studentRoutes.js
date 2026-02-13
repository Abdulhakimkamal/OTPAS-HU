import express from 'express';
import * as studentController from '../controllers/studentController.js';
import ProjectController from '../controllers/project.controller.js';
import EvaluationController from '../controllers/evaluation.controller.js';
import NotificationController from '../controllers/notification.controller.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import {
  verifyStudent,
  verifyProjectOwnership,
  verifyTitleApproved
} from '../middleware/authorization.js';
import { feedbackValidator, progressValidator } from '../validators/index.js';
import projectValidator from '../validators/project.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(verifyToken);
router.use(authorize('student'));

// Get assigned instructor
router.get('/assigned-instructor', studentController.getAssignedInstructor);

// Dashboard endpoints
router.get('/dashboard', studentController.getDashboardData);
router.get('/announcements', studentController.getAnnouncements);
router.get('/project-submissions', studentController.getProjectSubmissions);

// Instructor recommendations endpoints
router.get('/instructor-recommendations', studentController.getInstructorRecommendations);
router.put('/instructor-recommendations/:id/read', studentController.markRecommendationAsRead);

// ============================================
// PROJECT TITLE SUBMISSION WORKFLOW (NEW)
// ============================================
router.post('/project/title', 
  projectValidator.submitTitleValidation,
  validateRequest,
  ProjectController.submitTitle
);

router.get('/project/:id/status', 
  projectValidator.getProjectByIdValidation,
  validateRequest,
  ProjectController.getStatus
);

// ============================================
// FILE UPLOAD (NEW)
// ============================================
router.post('/project/:id/upload',
  verifyProjectOwnership,
  verifyTitleApproved,
  upload.single('file'),
  ProjectController.uploadFile
);

router.get('/project/:id/files',
  verifyProjectOwnership,
  projectValidator.getProjectByIdValidation,
  validateRequest,
  ProjectController.getProjectFiles
);

router.delete('/project/file/:id',
  ProjectController.deleteFile
);

router.post('/projects/submit', 
  upload.single('file'),
  validateRequest,
  studentController.submitProject
);

router.get('/projects', studentController.getStudentProjects);

// ============================================
// EVALUATIONS (ACADEMIC EVALUATION WORKFLOW)
// ============================================
router.get('/evaluations', EvaluationController.getEvaluations);

// ============================================
// NOTIFICATIONS
// ============================================
router.get('/notifications', NotificationController.getNotifications);
router.get('/notifications/unread/count', NotificationController.getUnreadCount);
router.patch('/notifications/:id/read', NotificationController.markAsRead);
router.patch('/notifications/read-all', NotificationController.markAllAsRead);
router.delete('/notifications/:id', NotificationController.deleteNotification);

router.get('/recommendations', studentController.getRecommendations);

router.post('/feedback', 
  feedbackValidator.createFeedbackValidation,
  validateRequest,
  studentController.submitFeedback
);

router.get('/progress', studentController.getProgress);

// ============================================
// TUTORIALS (LEGACY)
// ============================================
router.get('/tutorials', studentController.getTutorials);
router.get('/tutorials/:id', studentController.getTutorialById);
router.post('/tutorials/:id/progress', studentController.updateTutorialProgress);
router.post('/tutorials/:id/complete', studentController.markTutorialComplete);

// Course enrollment endpoints
router.get('/courses/available', studentController.getAvailableCourses);
router.get('/courses/enrolled', studentController.getEnrolledCourses);
router.post('/courses/enroll', studentController.enrollInCourse);
router.delete('/courses/:course_id/unenroll', studentController.unenrollFromCourse);

export default router;
