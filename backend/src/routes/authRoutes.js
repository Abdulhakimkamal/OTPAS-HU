import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken, authenticate } from '../middleware/auth.js';
import { userValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Super-Admin login (no authentication required)
router.post('/super-admin/login', 
  userValidator.loginValidation,
  validateRequest,
  authController.superAdminLogin
);

// Regular authentication
router.post('/register', 
  userValidator.createUserValidation,
  validateRequest,
  authController.register
);

router.post('/login', 
  userValidator.loginValidation,
  validateRequest,
  authController.login
);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', 
  authenticate,
  userValidator.updateProfileValidation,
  validateRequest,
  authController.updateProfile
);

router.post('/change-password', 
  authenticate,
  userValidator.changePasswordValidation,
  validateRequest,
  authController.changePassword
);

export default router;
