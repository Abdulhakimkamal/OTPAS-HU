import express from 'express';
import * as superAdminController from '../controllers/superAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { userValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All routes require authentication and super-admin role
router.use(authenticate);

// Create admin
router.post('/admins', 
  userValidator.createUserValidation,
  validateRequest,
  superAdminController.createAdmin
);

// Get all admins
router.get('/admins', superAdminController.getAllAdmins);

// Delete admin
router.delete('/admins/:adminId', 
  userValidator.deleteUserValidation,
  validateRequest,
  superAdminController.deleteAdmin
);

// Get system statistics
router.get('/stats', superAdminController.getSystemStats);

export default router;
