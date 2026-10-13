import Joi from 'joi';

const TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'];
const LEVELS = ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR'];
const MODES = ['ONSITE', 'REMOTE', 'HYBRID'];
const PERIODS = ['HOURLY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

// salaryMax must not be lower than salaryMin (only checked when both are numbers)
const salaryMax = Joi.number().min(0).allow(null).when('salaryMin', {
  is: Joi.number().required(),
  then: Joi.number().min(Joi.ref('salaryMin')).allow(null),
});

export const createJobSchema = Joi.object({
  title: Joi.string().trim().max(100).required(),
  description: Joi.string().required(),
  requirements: Joi.string().allow('', null),
  responsibilities: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string().trim().max(50)).max(30).optional(),
  employmentType: Joi.string().valid(...TYPES).required(),
  experienceLevel: Joi.string().valid(...LEVELS).required(),
  location: Joi.string().trim().allow('', null),
  remoteType: Joi.string().valid(...MODES).required(),
  salaryMin: Joi.number().min(0).allow(null).optional(),
  salaryMax: salaryMax.optional(),
  salaryCurrency: Joi.string().length(3).uppercase().default('INR'),
  salaryPeriod: Joi.string().valid(...PERIODS).default('YEARLY'),
  status: Joi.string().valid('DRAFT', 'PUBLISHED').default('DRAFT'),
  applicationDeadline: Joi.date().greater('now').allow(null).optional(),
});

// NOTE: no .default() here - otherwise every PATCH would silently reset currency/period/status
export const updateJobSchema = Joi.object({
  title: Joi.string().trim().max(100),
  description: Joi.string(),
  requirements: Joi.string().allow('', null),
  responsibilities: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string().trim().max(50)).max(30),
  employmentType: Joi.string().valid(...TYPES),
  experienceLevel: Joi.string().valid(...LEVELS),
  location: Joi.string().trim().allow('', null),
  remoteType: Joi.string().valid(...MODES),
  salaryMin: Joi.number().min(0).allow(null),
  salaryMax,
  salaryCurrency: Joi.string().length(3).uppercase(),
  salaryPeriod: Joi.string().valid(...PERIODS),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'),
  applicationDeadline: Joi.date().allow(null),
}).min(1);
