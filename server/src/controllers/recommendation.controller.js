import JobSeekerProfile from '../models/JobSeekerProfile.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { sendSuccess } from '../utils/response.js';
import { scoreJob, profileTips } from '../utils/recommendation.js';

const LIMIT = 12;

export const getRecommendedJobs = async (req, res, next) => {
  try {
    const [profile, applications] = await Promise.all([
      JobSeekerProfile.findOne({ user: req.user._id }).lean(),
      Application.find({ applicant: req.user._id }).select('job status').lean(),
    ]);

    // never recommend something the user already applied to (withdrawn ones may come back)
    const appliedIds = applications.filter((a) => a.status !== 'WITHDRAWN').map((a) => a.job);

    const now = new Date();
    const candidates = await Job.find({
      status: 'PUBLISHED',
      _id: { $nin: appliedIds },
      $or: [{ applicationDeadline: null }, { applicationDeadline: { $exists: false } }, { applicationDeadline: { $gte: now } }],
    })
      .sort({ publishedAt: -1 })
      .limit(300)
      .select('-description -requirements -responsibilities')
      .populate('company', 'name slug logo location')
      .lean();

    // jobs the user applied to in the past tell us what they are interested in
    const appliedJobs = applications.length
      ? await Job.find({ _id: { $in: applications.map((a) => a.job) } }).select('title skills').lean()
      : [];

    // description is needed only for the "job lists no skills" case, so fetch it lazily
    const withDesc = new Map();
    const noSkillIds = candidates.filter((j) => !j.skills?.length).map((j) => j._id);
    if (noSkillIds.length && profile?.skills?.length) {
      const docs = await Job.find({ _id: { $in: noSkillIds } }).select('description').lean();
      docs.forEach((d) => withDesc.set(String(d._id), d.description));
    }

    const scored = candidates.map((job) => {
      const { score, reasons } = scoreJob({ ...job, description: withDesc.get(String(job._id)) }, { profile, appliedJobs });
      return { ...job, matchScore: score, matchReasons: reasons };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore || new Date(b.publishedAt) - new Date(a.publishedAt));

    // keep real matches first; pad with the newest jobs so the page is never empty
    const good = scored.filter((j) => j.matchScore >= 25);
    const jobs = good.slice(0, LIMIT);
    if (jobs.length < 6) {
      const ids = new Set(jobs.map((j) => String(j._id)));
      for (const j of scored) {
        if (jobs.length >= 6) break;
        if (!ids.has(String(j._id))) jobs.push({ ...j, isFallback: true });
      }
    }

    return sendSuccess(res, 200, 'Recommended jobs fetched', {
      jobs,
      tips: profileTips(profile),
      basedOn: {
        skills: profile?.skills?.length || 0,
        appliedJobs: applications.length,
        hasPreferences: !!(profile?.preferences?.locations?.length || profile?.preferences?.jobTypes?.length || profile?.preferences?.experienceLevel),
      },
    });
  } catch (error) {
    next(error);
  }
};
