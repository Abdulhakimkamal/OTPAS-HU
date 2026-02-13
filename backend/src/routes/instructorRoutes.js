import express from 'express';
import * as instructorController from '../controllers/instructorController.js';
import ProjectController from '../controllers/project.controller.js';
import EvaluationController from '../controllers/evaluation.controller.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import {
  verifyInstructor,
  verifyInstructorAssignment,
  verifyInstructorProjectAccess
} from '../middleware/authorization.js';
import upload from '../middleware/upload.js';
import projectValidator from '../validators/project.validator.js';
import evaluationValidator from '../validators/evaluation.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(verifyToken);
router.use(authorize('instructor'));

// ============================================
// STUDENT MANAGEMENT (READ ONLY)
// ============================================
router.get('/students', instructorController.getAssignedStudents);
router.get('/student/:id', instructorController.getStudentById);
router.get('/student-progress/:id', instructorController.getStudentProgress);

// ============================================
// EVALUATIONS (ACADEMIC EVALUATION WORKFLOW)
// ============================================
router.post('/evaluation/create',
  verifyInstructorAssignment,
  evaluationValidator.createEvaluationValidation,
  validateRequest,
  EvaluationController.createEvaluation
);

router.patch('/evaluation/:id',
  evaluationValidator.updateEvaluationValidation,
  validateRequest,
  EvaluationController.updateEvaluation
);

router.get('/evaluation/:id',
  evaluationValidator.getEvaluationByIdValidation,
  validateRequest,
  EvaluationController.getEvaluationById
);

router.delete('/evaluation/:id',
  evaluationValidator.deleteEvaluationValidation,
  validateRequest,
  EvaluationController.deleteEvaluation
);

// Legacy evaluation endpoints (kept for backward compatibility)
router.post('/evaluation', instructorController.createEvaluation);
router.put('/evaluation/:id', instructorController.updateEvaluation);
router.get('/evaluations', instructorController.getEvaluations);

// ============================================
// FEEDBACK & GUIDANCE
// ============================================
router.post('/feedback', instructorController.createFeedback);
router.get('/feedback', instructorController.getFeedback);

// ============================================
// PROJECT COMMENTS (NEW)
// ============================================
router.post('/project/comment', instructorController.addProjectComment);
router.get('/project/:id/comments', instructorController.getProjectComments);

// ============================================
// PROJECT TITLE APPROVAL WORKFLOW (NEW)
// ============================================
router.post('/project/request-title', 
  projectValidator.requestTitleValidation,
  validateRequest,
  ProjectController.requestTitle
);

router.patch('/project/:id/approve', 
  verifyInstructorProjectAccess,
  projectValidator.approveTitleValidation,
  validateRequest,
  ProjectController.approveTitle
);

router.patch('/project/:id/disapprove', 
  verifyInstructorProjectAccess,
  projectValidator.disapproveTitleValidation,
  validateRequest,
  ProjectController.disapproveTitle
);

router.get('/projects/pending', ProjectController.getPendingProjects);

router.get('/projects', ProjectController.getInstructorProjects);

// ============================================
// COURSE-BASED TUTORIALS (NEW)
// ============================================
router.get('/courses/:courseId/tutorials', instructorController.getCourseTutorials);
router.post('/courses/:courseId/tutorials', instructorController.createCourseTutorial);
router.put('/courses/:courseId/tutorials/:tutorialId', instructorController.updateCourseTutorial);
router.get('/courses/:courseId/tutorials/:tutorialId/files', instructorController.getCourseTutorialFiles);
router.get('/courses/:courseId/tutorials/:tutorialId/files-filtered', instructorController.getCourseTutorialFilesFiltered);
router.post('/courses/:courseId/tutorials/:tutorialId/files', upload.single('file'), instructorController.uploadCourseTutorialFile);
router.post('/courses/:courseId/tutorials/:tutorialId/video-link', instructorController.addVideoLink);
router.get('/courses/:courseId/tutorials/:tutorialId/files/:fileId/download', instructorController.downloadCourseTutorialFile);
router.delete('/courses/:courseId/tutorials/:tutorialId/files/:fileId', instructorController.deleteCourseTutorialFile);

// ============================================
// TUTORIALS (INSTRUCTOR MANAGEMENT) - LEGACY
// ============================================
router.get('/tutorials', instructorController.getInstructorTutorials);
router.get('/assigned-courses', instructorController.getAssignedCourses);

// ============================================
// ANNOUNCEMENTS (NEW)
// ============================================
router.post('/announcement', upload.single('attachment'), instructorController.createAnnouncement);
router.get('/announcements', instructorController.getAnnouncements);

// ============================================
// FILE UPLOAD
// ============================================
router.post('/upload-file', instructorController.uploadFile);

// ============================================
// REPORTING
// ============================================
router.get('/reports', instructorController.getReports);
router.get('/analytics', instructorController.getAnalytics);

// ============================================
// ACCOUNT MANAGEMENT
// ============================================
router.get('/profile', instructorController.getProfile);
router.put('/profile', instructorController.updateProfile);
router.put('/change-password', instructorController.changePassword);

// ============================================
// SETTINGS
// ============================================
router.get('/settings/notifications', instructorController.getNotificationSettings);
router.put('/settings/notifications', instructorController.updateNotificationSettings);

// ============================================
// MY COURSES
// ============================================
router.get('/my-courses', instructorController.getMyCourses);

// ============================================
// GRADE CALCULATION (NEW)
// ============================================
router.post('/calculate-grade', instructorController.calculateGradeFromScore);

// ============================================
// CUMULATIVE SCORE CALCULATION (NEW)
// ============================================
router.get('/cumulative-score/:student_id/:course_id', instructorController.getCumulativeScore);

export default router;
