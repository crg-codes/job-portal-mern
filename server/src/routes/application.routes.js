import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { applySchema, statusSchema, noteSchema } from '../validators/application.validator.js';

import {
  uploadResumeFile,
  getMyResumes,
  updateResumeFile,
  deleteResume,
  setDefaultResume,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  addApplicationNote
} from '../controllers/application.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ===============================
// JOB SEEKER - RESUME
// ===============================

router.post(
  '/resumes',
  authorize('JOB_SEEKER'),
  uploadResume.single('file'),
  uploadResumeFile
);

router.get(
  '/resumes',
  authorize('JOB_SEEKER'),
  getMyResumes
);

router.put(
  '/resumes/:id',
  authorize('JOB_SEEKER'),
  uploadResume.single('file'),
  updateResumeFile
);

router.delete(
  '/resumes/:id',
  authorize('JOB_SEEKER'),
  deleteResume
);

router.patch(
  '/resumes/:id/default',
  authorize('JOB_SEEKER'),
  setDefaultResume
);

// ===============================
// JOB SEEKER - APPLICATIONS
// ===============================

router.post(
  '/apply',
  authorize('JOB_SEEKER'),
  validate(applySchema),
  applyToJob
);

router.get(
  '/me',
  authorize('JOB_SEEKER'),
  getMyApplications
);

router.patch(
  '/:id/withdraw',
  authorize('JOB_SEEKER'),
  withdrawApplication
);

// ===============================
// EMPLOYER - ATS
// ===============================

router.get(
  '/job/:jobId',
  authorize('EMPLOYER'),
  getJobApplications
);

router.patch(
  '/:id/status',
  authorize('EMPLOYER'),
  validate(statusSchema),
  updateApplicationStatus
);

router.post(
  '/:id/notes',
  authorize('EMPLOYER'),
  validate(noteSchema),
  addApplicationNote
);

export default router;