import { sendError } from '../utils/response.js';

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Remove unknown fields
  });

  if (error) {
    const errorMessages = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return sendError(res, 400, 'Validation Error', errorMessages);
  }

  // Assign validated values back to req.body
  req.body = value;
  next();
};
