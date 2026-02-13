import express from 'express';
import TutorialFilesController from '../controllers/tutorial-files.controller.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import {
  verifyTutorialFileUploadPermission,
  verifyTutorialMaterialAccess,
  verifyDepartmentHeadAccess
} from '../middleware/authorization.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ============================================
// TUTORIAL FILE MANAGEMENT
// ============================================

// Upload tutorial file (Instructor/Admin only)
router.post('/tutorials/:tutorialId/files',
  verifyTutorialFileUploadPermission,
  upload.single('file'),
  TutorialFilesController.uploadFile
);

// Upload tutorial video (Instructor/Admin only)
router.post('/tutorials/:tutorialId/videos',
  verifyTutorialFileUploadPermission,
  upload.single('video'),
  TutorialFilesController.uploadVideo
);

// Add video link (Instructor/Admin only)
router.post('/tutorials/:tutorialId/video-link',
  verifyTutorialFileUploadPermission,
  TutorialFilesController.addVideoLink
);

// Get tutorial files (All authenticated users with proper access)
router.get('/tutorials/:tutorialId/files',
  verifyTutorialMaterialAccess,
  TutorialFilesController.getTutorialFiles
);

// Get tutorial videos (All authenticated users with proper access)
router.get('/tutorials/:tutorialId/videos',
  verifyTutorialMaterialAccess,
  TutorialFilesController.getTutorialVideos
);

// Download file (All authenticated users)
router.get('/files/:fileId/download',
  TutorialFilesController.downloadFile
);

// Delete tutorial file (Instructor/Admin only - own files)
router.delete('/files/:fileId',
  TutorialFilesController.deleteFile
);

// ============================================
// DEPARTMENT HEAD MONITORING (READ-ONLY)
// ============================================

// Get course materials overview (Department Head only)
router.get('/department/course-materials-overview',
  authorize('department_head'),
  verifyDepartmentHeadAccess,
  TutorialFilesController.getCourseMaterialsOverview
);

export default router;