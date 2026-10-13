import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getRecommendedJobs } from '../controllers/recommendation.controller.js';

const router = express.Router();

router.use(protect);
router.use(authorize('JOB_SEEKER'));

router.get('/jobs', getRecommendedJobs);

export default router;
