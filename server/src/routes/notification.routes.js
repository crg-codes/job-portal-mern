import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';

const router = express.Router();

router.use(protect); // All routes require auth

router.get('/', getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
