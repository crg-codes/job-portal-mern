import fs from 'fs/promises';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import EmployerProfile from '../models/EmployerProfile.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { urlToDiskPath } from '../config/paths.js';

// name / phone live on the User document, not on the profile
const ACCOUNT_FIELDS = ['firstName', 'lastName', 'phone'];

// % of the seeker profile that is filled in
const completion = (p) => {
  const checks = [
    p.headline, p.bio, p.location, p.skills?.length, p.experience?.length, p.education?.length,
    p.preferences?.locations?.length, p.preferences?.jobTypes?.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image uploaded');
    }

    const avatarUrl = `/uploads/images/${req.file.filename}`;
    const old = req.user.avatar;

    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
    if (old) await fs.unlink(urlToDiskPath(old)).catch(() => {});

    return sendSuccess(res, 200, 'Avatar uploaded successfully', { avatar: avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    let profile;
    if (req.user.role === 'JOB_SEEKER') {
      profile = await JobSeekerProfile.findOne({ user: req.user.id }).populate('user', 'firstName lastName email phone avatar');
    } else if (req.user.role === 'EMPLOYER') {
      profile = await EmployerProfile.findOne({ user: req.user.id }).populate('user', 'firstName lastName email phone avatar').populate('company');
    }

    if (!profile) {
      // No profile yet: still return the account so the form can show name/phone/avatar
      const user = await User.findById(req.user.id).select('firstName lastName email phone avatar');
      return sendSuccess(res, 200, 'Profile not found, please complete your profile', { profile: { user } });
    }

    return sendSuccess(res, 200, 'Profile fetched successfully', { profile });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const body = { ...req.body };

    const account = {};
    ACCOUNT_FIELDS.forEach((f) => {
      if (body[f] !== undefined) account[f] = body[f];
      delete body[f];
    });
    if (Object.keys(account).length) {
      await User.findByIdAndUpdate(req.user.id, account, { runValidators: true });
    }

    let profile;
    if (req.user.role === 'JOB_SEEKER') {
      profile = await JobSeekerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: body },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      profile.profileCompletionPercentage = completion(profile);
      await profile.save();
    } else if (req.user.role === 'EMPLOYER') {
      profile = await EmployerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: body },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } else {
      return sendError(res, 403, 'Admins do not have profiles in this context');
    }

    return sendSuccess(res, 200, 'Profile updated successfully', { profile });
  } catch (error) {
    next(error);
  }
};
