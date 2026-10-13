import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getPlatformStats,
  getUsers,
  updateUserStatus,
  getJobs,
  updateJobStatus
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes are strictly protected
router.use(protect);
router.use(authorize('ADMIN'));

// Platform Stats
router.get('/stats', getPlatformStats);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Job Management
router.get('/jobs', getJobs);
router.patch('/jobs/:id/status', updateJobStatus);

export default router;
