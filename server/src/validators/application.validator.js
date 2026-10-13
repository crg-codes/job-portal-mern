import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const applySchema = Joi.object({
  jobId: objectId.required(),
  resumeId: objectId.required().messages({ 'any.required': 'Please choose a resume' }),
  coverLetter: Joi.string().max(3000).allow('', null),
});

export const statusSchema = Joi.object({
  status: Joi.string().valid('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED').required(),
});

export const noteSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
});
