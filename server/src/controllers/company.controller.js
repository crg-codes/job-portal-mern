import Company from '../models/Company.js';
import EmployerProfile from '../models/EmployerProfile.js';
import Job from '../models/Job.js';
import fs from 'fs/promises';
import { sendSuccess, sendError } from '../utils/response.js';
import { urlToDiskPath } from '../config/paths.js';
import { escapeRegex } from '../utils/jobFilters.js';

export const createCompany = async (req, res, next) => {
  try {
    const { name, description, website, industry, companySize, foundedYear, location, headquarters, contactEmail, contactPhone } = req.body;

    // one company per employer account
    const mine = await EmployerProfile.findOne({ user: req.user.id });
    if (mine?.company) {
      return sendError(res, 400, 'You already have a company profile. Edit it instead.');
    }

    const companyExists = await Company.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') });
    if (companyExists) {
      return sendError(res, 400, 'Company name already exists');
    }

    const company = await Company.create({
      name,
      description,
      website,
      industry,
      companySize,
      foundedYear,
      location,
      headquarters,
      contactEmail,
      contactPhone,
      createdBy: req.user.id
    });

    // Link company to employer profile
    await EmployerProfile.findOneAndUpdate(
      { user: req.user.id },
      { company: company._id },
      { upsert: true }
    );

    return sendSuccess(res, 201, 'Company created successfully', { company });
  } catch (error) {
    next(error);
  }
};

export const getMyCompany = async (req, res, next) => {
  try {
    const employerProfile = await EmployerProfile.findOne({ user: req.user.id }).populate('company');
    
    if (!employerProfile || !employerProfile.company) {
      return sendSuccess(res, 200, 'No company registered yet', null);
    }

    return sendSuccess(res, 200, 'Company fetched successfully', { company: employerProfile.company });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!company) {
      return sendError(res, 404, 'Company not found or unauthorized');
    }

    return sendSuccess(res, 200, 'Company updated successfully', { company });
  } catch (error) {
    next(error);
  }
};

export const getCompanyBySlug = async (req, res, next) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    
    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    const jobs = await Job.find({
      company: company._id,
      status: 'PUBLISHED',
      $or: [{ applicationDeadline: null }, { applicationDeadline: { $exists: false } }, { applicationDeadline: { $gte: new Date() } }],
    })
      .select('-description -requirements -responsibilities')
      .sort({ publishedAt: -1 });
    return sendSuccess(res, 200, 'Company fetched successfully', { company, jobs });
  } catch (error) {
    next(error);
  }
};


export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 400, 'No image uploaded');
    const existing = await Company.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!existing) {
      await fs.unlink(req.file.path).catch(() => {});
      return sendError(res, 404, 'Company not found or unauthorized');
    }
    const oldLogo = existing.logo;
    existing.logo = `/uploads/images/${req.file.filename}`;
    const company = await existing.save();
    if (oldLogo) await fs.unlink(urlToDiskPath(oldLogo)).catch(() => {});
    return sendSuccess(res, 200, 'Company logo uploaded successfully', { company });
  } catch (error) {
    next(error);
  }
};
