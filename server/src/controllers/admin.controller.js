import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Get platform statistics
export const getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const totalJobs = await Job.countDocuments({ status: { $ne: 'DELETED' } });
    const activeJobs = await Job.countDocuments({ status: 'PUBLISHED' });
    const totalCompanies = await Company.countDocuments();
    const totalApplications = await Application.countDocuments();

    return sendSuccess(res, 200, 'Platform stats fetched successfully', {
      stats: {
        totalUsers,
        activeUsers,
        totalJobs,
        activeJobs,
        totalCompanies,
        totalApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users with pagination
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return sendSuccess(res, 200, 'Users fetched successfully', {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    if (req.params.id === String(req.user._id)) {
      return sendError(res, 400, 'You cannot change your own account status');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User status updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// Get all jobs with pagination
export const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const query = { status: { $ne: 'DELETED' } };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('company', 'name logo')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return sendSuccess(res, 200, 'Jobs fetched successfully', {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update job status
export const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'].includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!job) {
      return sendError(res, 404, 'Job not found');
    }

    return sendSuccess(res, 200, 'Job status updated successfully', { job });
  } catch (error) {
    next(error);
  }
};
