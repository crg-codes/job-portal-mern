import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const startIndex = (page - 1) * limit;

    const query = { recipient: req.user.id };

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return sendSuccess(res, 200, 'Notifications fetched successfully', {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    return sendSuccess(res, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    if (!n) return sendError(res, 404, 'Notification not found');
    return sendSuccess(res, 200, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

// Internal utility to create notifications
export const createNotification = async ({ recipient, title, message, type, actionUrl, relatedData }) => {
  const data = { recipient, title, message, type, actionUrl, relatedData };
  try {
    return await Notification.create(data);
  } catch (error) {
    console.error(`[notification] FAILED type=${type} recipient=${recipient}: ${error.message}`);
    // e.g. an older Notification model that does not know this type yet: still deliver it
    if (error.name === 'ValidationError' && error.errors?.type) {
      try {
        return await Notification.create({ ...data, type: 'SYSTEM' });
      } catch (e) {
        console.error('[notification] retry failed:', e.message);
      }
    }
    return null;
  }
};
