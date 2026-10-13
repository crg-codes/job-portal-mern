import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import Application from '../models/Application.js';
import EmployerProfile from '../models/EmployerProfile.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { buildJobFilter, buildSort, escapeRegex, canonicalCity } from '../utils/jobFilters.js';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Helper to get Employer's Company ID
const getEmployerCompanyId = async (userId) => {
  const profile = await EmployerProfile.findOne({ user: userId });
  return profile?.company;
};

const paging = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

/* ------------------------------------------------------------------ */
/* EMPLOYER                                                            */
/* ------------------------------------------------------------------ */

export const createJob = async (req, res, next) => {
  try {
    const companyId = await getEmployerCompanyId(req.user.id);
    if (!companyId) {
      return sendError(res, 400, 'You must create or link a company profile before posting a job.');
    }

    const job = await Job.create({
      ...req.body,
      company: companyId,
      createdBy: req.user.id,
      publishedAt: req.body.status === 'PUBLISHED' ? new Date() : undefined,
    });

    return sendSuccess(res, 201, 'Job created successfully', { job });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user.id, status: { $ne: 'DELETED' } });
    if (!job) return sendError(res, 404, 'Job not found or unauthorized');

    const update = { ...req.body };
    // First time it goes live -> stamp the publish date
    if (update.status === 'PUBLISHED' && !job.publishedAt) {
      update.publishedAt = new Date();
    }

    // allow clearing optional fields with null
    const $set = {};
    const $unset = {};
    Object.entries(update).forEach(([k, v]) => {
      if (v === null) $unset[k] = '';
      else $set[k] = v;
    });

    const updatedJob = await Job.findByIdAndUpdate(
      job._id,
      { ...(Object.keys($set).length && { $set }), ...(Object.keys($unset).length && { $unset }) },
      { returnDocument: 'after', runValidators: true }
    );

    return sendSuccess(res, 200, 'Job updated successfully', { job: updatedJob });
  } catch (error) {
    next(error);
  }
};

// Soft delete: the job disappears everywhere but applications are kept
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id, status: { $ne: 'DELETED' } },
      { status: 'DELETED' },
      { returnDocument: 'after' }
    );
    if (!job) return sendError(res, 404, 'Job not found or unauthorized');
    return sendSuccess(res, 200, 'Job deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);

    const query = { createdBy: req.user._id, status: { $ne: 'DELETED' } };
    if (['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED'].includes(req.query.status)) {
      query.status = req.query.status;
    }
    if (req.query.q) query.title = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), 'i');

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('company', 'name logo')
      .lean();

    // applicant counts for the ATS column
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobs.map((j) => j._id) }, status: { $ne: 'WITHDRAWN' } } },
      { $group: { _id: '$job', total: { $sum: 1 }, newCount: { $sum: { $cond: [{ $eq: ['$status', 'APPLIED'] }, 1, 0] } } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c]));
    jobs.forEach((j) => {
      const c = countMap.get(String(j._id));
      j.applicantCount = c?.total || 0;
      j.newApplicantCount = c?.newCount || 0;
    });

    return sendSuccess(res, 200, 'Jobs fetched successfully', {
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* PUBLIC - BROWSE JOBS                                                */
/* ------------------------------------------------------------------ */

export const searchJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);

    // keyword can also be a company name
    let companyIds = [];
    const keyword = String(req.query.keyword || req.query.q || '').trim();
    if (keyword) {
      const matched = await Company.find({ name: new RegExp(escapeRegex(keyword.slice(0, 100)), 'i') })
        .select('_id')
        .limit(50)
        .lean();
      companyIds = matched.map((c) => c._id);
    }

    const filter = buildJobFilter(req.query, { companyIds });

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .sort(buildSort(req.query.sortBy))
        .skip(skip)
        .limit(limit)
        .select('-description -requirements -responsibilities')
        .populate('company', 'name slug logo location')
        .lean(),
    ]);

    // Mark jobs the logged-in job seeker already applied to
    if (req.user?.role === 'JOB_SEEKER' && jobs.length) {
      const apps = await Application.find({ applicant: req.user._id, job: { $in: jobs.map((j) => j._id) } })
        .select('job status createdAt')
        .lean();
      const map = new Map(apps.map((a) => [String(a.job), a]));
      jobs.forEach((j) => {
        const a = map.get(String(j._id));
        if (a && a.status !== 'WITHDRAWN') j.myApplication = { _id: a._id, status: a.status, appliedAt: a.createdAt };
      });
    }

    return sendSuccess(res, 200, 'Jobs fetched successfully', {
      jobs,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    next(error);
  }
};

// Options for the filter dropdowns (locations that really have jobs)
export const getFilterOptions = async (req, res, next) => {
  try {
    const locations = await Job.distinct('location', {
      status: 'PUBLISHED',
      location: { $nin: [null, ''] },
    });
    const cities = [...new Set(locations.map(canonicalCity).filter(Boolean))].sort();
    return sendSuccess(res, 200, 'Filter options fetched', { locations: cities });
  } catch (error) {
    next(error);
  }
};

export const getJobByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = OBJECT_ID.test(id) ? { _id: id } : { slug: id };

    const job = await Job.findOne({ ...query, status: { $ne: 'DELETED' } })
      .populate('company')
      .lean();
    if (!job) return sendError(res, 404, 'Job not found');

    const isOwner = req.user && String(job.createdBy) === String(req.user._id);
    const isAdmin = req.user?.role === 'ADMIN';
    if (job.status !== 'PUBLISHED' && !isOwner && !isAdmin) {
      return sendError(res, 403, 'Job is not available');
    }

    job.isExpired = !!(job.applicationDeadline && new Date(job.applicationDeadline) < new Date());
    job.isOwner = !!isOwner;

    if (req.user?.role === 'JOB_SEEKER') {
      const app = await Application.findOne({ job: job._id, applicant: req.user._id }).select('status createdAt statusHistory').lean();
      if (app && app.status !== 'WITHDRAWN') job.myApplication = app;
    }

    return sendSuccess(res, 200, 'Job fetched successfully', { job });
  } catch (error) {
    next(error);
  }
};
