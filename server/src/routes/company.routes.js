import express from 'express';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { createCompanySchema, updateCompanySchema } from '../validators/profile.validator.js';
import { createCompany, getMyCompany, updateCompany, getCompanyBySlug, uploadCompanyLogo } from '../controllers/company.controller.js';
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// Public route - anyone can view a company profile by slug
router.get('/slug/:slug', getCompanyBySlug);

// Protected routes (Employers only)
router.post('/', protect, authorize('EMPLOYER'), validate(createCompanySchema), createCompany);
router.get('/me', protect, authorize('EMPLOYER'), getMyCompany);
router.patch('/:id', protect, authorize('EMPLOYER'), validate(updateCompanySchema), updateCompany);
router.post('/:id/logo', protect, authorize('EMPLOYER'), uploadImage.single('file'), uploadCompanyLogo);

export default router;
