import fs from 'fs/promises';
import Application from '../models/Application.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createNotification } from './notification.controller.js';
import { urlToDiskPath } from '../config/paths.js';
import { normSkill } from '../utils/recommendation.js';

const MAX_RESUMES = 10;
const EMPLOYER_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

// Delete a resume file only when no application still points to it
const removeFileIfUnused = async (fileUrl, resumeId) => {
  const used = await Application.exists({
    $or: [{ 'resumeSnapshot.fileUrl': fileUrl }, ...(resumeId ? [{ resume: resumeId }] : [])],
  });
  if (used) return;
  try {
    await fs.unlink(urlToDiskPath(fileUrl));
  } catch (_) {
    /* file already gone */
  }
};

// ---- JOB SEEKER: RESUMES ---- //

export const uploadResumeFile = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');

    const resumeCount = await Resume.countDocuments({ user: req.user.id });
    if (resumeCount >= MAX_RESUMES) {
      await fs.unlink(req.file.path).catch(() => {});
      return sendError(res, 400, `You can store up to ${MAX_RESUMES} resumes. Delete one first.`);
    }

    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/resumes/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      isDefault: resumeCount === 0,
    });

    return sendSuccess(res, 201, 'Resume uploaded successfully', { resume });
  } catch (error) {
    next(error);
  }
};

export const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    return sendSuccess(res, 200, 'Resumes fetched', { resumes });
  } catch (error) {
    next(error);
  }
};

export const updateResumeFile = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      await fs.unlink(req.file.path).catch(() => {});
      return sendError(res, 404, 'Resume not found');
    }

    const oldUrl = resume.fileUrl;
    resume.fileName = req.file.originalname;
    resume.fileUrl = `/uploads/resumes/${req.file.filename}`;
    resume.fileType = req.file.mimetype;
    resume.fileSize = req.file.size;
    await resume.save();

    // old file stays on disk if an earlier application still shows it to an employer
    await removeFileIfUnused(oldUrl);

    return sendSuccess(res, 200, 'Resume updated successfully', { resume });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found');

    const wasDefault = resume.isDefault;
    await resume.deleteOne();
    await removeFileIfUnused(resume.fileUrl, resume._id);

    if (wasDefault) {
      const replacement = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (replacement) {
        replacement.isDefault = true;
        await replacement.save();
      }
    }

    return sendSuccess(res, 200, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const setDefaultResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found');

    await Resume.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
    resume.isDefault = true;
    await resume.save();

    return sendSuccess(res, 200, 'Default resume updated', { resume });
  } catch (error) {
    next(error);
  }
};

// ---- JOB SEEKER: APPLICATIONS ---- //

export const applyToJob = async (req, res, next) => {
  try {
    const { jobId, resumeId, coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'PUBLISHED') {
      return sendError(res, 404, 'Job not found or not open for applications');
    }
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return sendError(res, 400, 'The application deadline for this job has passed');
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found');

    const snapshot = { fileName: resume.fileName, fileUrl: resume.fileUrl, fileType: resume.fileType };
    const existing = await Application.findOne({ job: jobId, applicant: req.user.id });

    if (existing) {
      // Only a withdrawn application may be re-submitted; everything else is a duplicate
      if (existing.status !== 'WITHDRAWN') {
        return sendError(res, 409, 'You have already applied for this job', [
          { field: 'status', message: existing.status },
        ]);
      }
      existing.status = 'APPLIED';
      existing.resume = resume._id;
      existing.resumeSnapshot = snapshot;
      existing.coverLetter = coverLetter;
      existing.statusHistory.push({ status: 'APPLIED', changedBy: req.user._id });
      await existing.save();
      await notifyEmployer(job, req.user);
      return sendSuccess(res, 201, 'Application submitted successfully', { application: existing });
    }

    let application;
    try {
      application = await Application.create({
        job: jobId,
        applicant: req.user.id,
        company: job.company,
        resume: resume._id,
        resumeSnapshot: snapshot,
        coverLetter,
        statusHistory: [{ status: 'APPLIED', changedBy: req.user._id }],
      });
    } catch (err) {
      // two clicks at the same time -> unique index (job + applicant) protects us
      if (err.code === 11000) return sendError(res, 409, 'You have already applied for this job');
      throw err;
    }

    await notifyEmployer(job, req.user);
    return sendSuccess(res, 201, 'Application submitted successfully', { application });
  } catch (error) {
    next(error);
  }
};

// Employer gets "new application", the job seeker gets a confirmation
const notifyEmployer = async (job, user) => {
  console.log(`[notification] new application on "${job.title}" -> employer ${job.createdBy}`);
  await createNotification({
    recipient: job.createdBy,
    title: 'New Application Received',
    message: `${user.firstName} ${user.lastName} applied for ${job.title}.`,
    type: 'NEW_APPLICATION',
    actionUrl: `/employer/jobs/${job._id}/applicants`,
  });
  await createNotification({
    recipient: user._id,
    title: 'Application Submitted',
    message: `Your application for ${job.title} was submitted successfully.`,
    type: 'APPLICATION_STATUS_UPDATE',
    actionUrl: '/profile/seeker/applications',
  });
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({ path: 'job', select: 'title slug location employmentType status' })
      .populate({ path: 'company', select: 'name slug logo' })
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Applications fetched', { applications });
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id });
    if (!application) return sendError(res, 404, 'Application not found');

    if (['HIRED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
      return sendError(res, 400, `This application is already ${application.status.toLowerCase()}`);
    }

    application.status = 'WITHDRAWN';
    application.statusHistory.push({ status: 'WITHDRAWN', changedBy: req.user._id });
    await application.save();

    const job = await Job.findById(application.job).select('title createdBy');
    if (job) {
      await createNotification({
        recipient: job.createdBy,
        title: 'Application Withdrawn',
        message: `${req.user.firstName} ${req.user.lastName} withdrew their application for ${job.title}.`,
        type: 'NEW_APPLICATION',
        actionUrl: `/employer/jobs/${job._id}/applicants`,
      });
    }

    return sendSuccess(res, 200, 'Application withdrawn', { application });
  } catch (error) {
    next(error);
  }
};

// ---- EMPLOYER: ATS ---- //

export const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) return sendError(res, 403, 'Unauthorized to view these applications');

    const applications = await Application.find({ job: jobId })
      .populate({ path: 'applicant', select: 'firstName lastName email phone avatar' })
      .populate('resume')
      .populate({ path: 'notes.addedBy', select: 'firstName lastName' })
      .sort({ createdAt: -1 })
      .lean();

    // attach candidate profile + skill match so the employer can shortlist quickly
    const profiles = await JobSeekerProfile.find({ user: { $in: applications.map((a) => a.applicant?._id) } })
      .select('user headline location skills')
      .lean();
    const profileMap = new Map(profiles.map((p) => [String(p.user), p]));
    const jobSkills = (job.skills || []).map(normSkill);

    applications.forEach((a) => {
      const p = profileMap.get(String(a.applicant?._id));
      a.applicantProfile = p ? { headline: p.headline, location: p.location, skills: p.skills } : null;
      const have = new Set((p?.skills || []).map(normSkill));
      a.skillMatch = jobSkills.length ? Math.round((jobSkills.filter((s) => have.has(s)).length / jobSkills.length) * 100) : null;
      // always give the employer a working resume link, even if the seeker later deleted the resume
      a.resumeFile = a.resumeSnapshot?.fileUrl ? a.resumeSnapshot : a.resume ? { fileName: a.resume.fileName, fileUrl: a.resume.fileUrl } : null;
    });

    console.log(`[ATS] job "${job.title}" (${jobId}) -> ${applications.length} application(s)`);
    return sendSuccess(res, 200, 'Applications fetched', { applications });
  } catch (error) {
    next(error);
  }
};

const loadOwnedApplication = async (id, userId) => {
  const application = await Application.findById(id).populate('job');
  if (!application || !application.job) return { error: [404, 'Application not found'] };
  if (String(application.job.createdBy) !== String(userId)) return { error: [403, 'Unauthorized'] };
  return { application };
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!EMPLOYER_STATUSES.includes(status)) return sendError(res, 400, 'Invalid status');

    const { application, error } = await loadOwnedApplication(req.params.id, req.user.id);
    if (error) return sendError(res, error[0], error[1]);

    if (application.status === 'WITHDRAWN') {
      return sendError(res, 400, 'The candidate withdrew this application');
    }
    if (application.status === status) {
      return sendSuccess(res, 200, 'Application status unchanged', { application });
    }

    application.status = status;
    application.statusHistory.push({ status, changedBy: req.user._id });
    await application.save();

    await createNotification({
      recipient: application.applicant,
      title: 'Application Status Updated',
      message: `Your application for ${application.job.title} has been moved to ${status}.`,
      type: 'APPLICATION_STATUS_UPDATE',
      actionUrl: '/profile/seeker/applications',
    });

    return sendSuccess(res, 200, 'Application status updated', { application });
  } catch (error) {
    next(error);
  }
};

export const addApplicationNote = async (req, res, next) => {
  try {
    const { application, error } = await loadOwnedApplication(req.params.id, req.user.id);
    if (error) return sendError(res, error[0], error[1]);

    application.notes.push({ text: req.body.text, addedBy: req.user._id });
    await application.save();
    await application.populate({ path: 'notes.addedBy', select: 'firstName lastName' });

    return sendSuccess(res, 201, 'Note added', { notes: application.notes });
  } catch (error) {
    next(error);
  }
};
