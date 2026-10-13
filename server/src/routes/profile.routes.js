import express from 'express';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { updateJobSeekerProfileSchema, updateEmployerProfileSchema } from '../validators/profile.validator.js';
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js';

const router = express.Router();

router.use(protect); // All profile routes require authentication

router.get('/me', getMyProfile);

// Route mapping based on role could be handled inside the controller or middleware
router.patch('/me/job-seeker', authorize('JOB_SEEKER'), validate(updateJobSeekerProfileSchema), updateMyProfile);
router.patch('/me/employer', authorize('EMPLOYER'), validate(updateEmployerProfileSchema), updateMyProfile);

import { uploadImage } from '../middleware/upload.js';
import { uploadAvatar } from '../controllers/profile.controller.js';

router.post('/avatar', uploadImage.single('file'), uploadAvatar);

export default router;
