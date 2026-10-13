import express from 'express';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import {
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordChangeSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

// Slow down brute-force attempts on sensitive endpoints
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, validate(passwordResetSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, validate(passwordChangeSchema), changePassword);

export default router;
