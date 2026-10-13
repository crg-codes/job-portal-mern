import express from 'express';
import { validate } from '../middleware/validate.js';
import { protect, optionalProtect, authorize } from '../middleware/auth.js';
import { createJobSchema, updateJobSchema } from '../validators/job.validator.js';
import {
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  searchJobs,
  getFilterOptions,
  getJobByIdOrSlug,
} from '../controllers/job.controller.js';

const router = express.Router();

// Public routes (optionalProtect lets us flag "already applied" for logged-in seekers)
router.get('/search', optionalProtect, searchJobs);
router.get('/meta/filters', getFilterOptions);

// Employer routes - must be declared BEFORE '/:id'
router.get('/employer/me', protect, authorize('EMPLOYER'), getMyJobs);
router.post('/', protect, authorize('EMPLOYER'), validate(createJobSchema), createJob);

router.get('/:id', optionalProtect, getJobByIdOrSlug);
router.patch('/:id', protect, authorize('EMPLOYER'), validate(updateJobSchema), updateJob);
router.delete('/:id', protect, authorize('EMPLOYER'), deleteJob);

export default router;
