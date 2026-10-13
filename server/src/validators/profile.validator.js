import Joi from 'joi';

const date = () => Joi.date().allow('', null);

export const updateJobSeekerProfileSchema = Joi.object({
  firstName: Joi.string().trim().max(50),
  lastName: Joi.string().trim().max(50),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow('', null).messages({ 'string.pattern.base': 'Please provide a valid phone number (digits only, optional +country code)' }),
  headline: Joi.string().max(100).allow('', null),
  bio: Joi.string().max(2000).allow('', null),
  location: Joi.string().allow('', null),
  website: Joi.string().uri().allow('', null),
  socialLinks: Joi.object({
    linkedin: Joi.string().uri().allow('', null),
    github: Joi.string().uri().allow('', null),
    twitter: Joi.string().uri().allow('', null),
    portfolio: Joi.string().uri().allow('', null),
  }).optional(),
  skills: Joi.array().items(Joi.string().trim().max(50)).max(50).optional(),
  experience: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      company: Joi.string().required(),
      location: Joi.string().allow('', null),
      from: Joi.date().required(),
      to: date().optional(),
      current: Joi.boolean().default(false),
      description: Joi.string().allow('', null),
    })
  ).optional(),
  education: Joi.array().items(
    Joi.object({
      school: Joi.string().required(),
      degree: Joi.string().required(),
      fieldOfStudy: Joi.string().required(),
      from: Joi.date().required(),
      to: date().optional(),
      current: Joi.boolean().default(false),
      description: Joi.string().allow('', null),
    })
  ).optional(),
  preferences: Joi.object({
    locations: Joi.array().items(Joi.string()).optional(),
    jobTypes: Joi.array().items(Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE')).optional(),
    salaryMin: Joi.number().min(0).allow(null).optional(),
    experienceLevel: Joi.string().valid('ENTRY', 'MID', 'SENIOR', 'EXECUTIVE', 'DIRECTOR').allow(null).optional(),
    remotePreference: Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID').allow(null).optional(),
  }).optional()
});

export const updateEmployerProfileSchema = Joi.object({
  firstName: Joi.string().trim().max(50),
  lastName: Joi.string().trim().max(50),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow('', null).messages({ 'string.pattern.base': 'Please provide a valid phone number (digits only, optional +country code)' }),
  jobTitle: Joi.string().max(100).allow('', null),
  designation: Joi.string().allow('', null),
  contactDetails: Joi.object({
    phone: Joi.string().allow('', null),
    alternativeEmail: Joi.string().email().allow('', null),
  }).optional(),
});

export const createCompanySchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(3000).allow('', null),
  website: Joi.string().uri().allow('', null),
  industry: Joi.string().allow('', null),
  companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').allow('', null),
  foundedYear: Joi.number().min(1800).max(new Date().getFullYear()).allow(null, ''),
  location: Joi.string().allow('', null),
  headquarters: Joi.string().allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  contactPhone: Joi.string().allow('', null),
});

export const updateCompanySchema = createCompanySchema.keys({
  name: Joi.string().max(100).optional(),
});
