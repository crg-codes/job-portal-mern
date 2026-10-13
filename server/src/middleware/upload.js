import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RESUME_DIR, IMAGE_DIR } from '../config/paths.js';

fs.mkdirSync(RESUME_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const makeStorage = (dir) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
  });

// Resumes: PDF / DOC / DOCX only (checks both MIME type and extension)
const resumeMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const resumeExts = ['.pdf', '.doc', '.docx'];

export const uploadResume = multer({
  storage: makeStorage(RESUME_DIR),
  fileFilter: (req, file, cb) => {
    const ok = resumeMimes.includes(file.mimetype) && resumeExts.includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : badRequest('Invalid file type. Only PDF and DOC/DOCX files are allowed.'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Images: no SVG (SVG files can carry scripts)
const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export const uploadImage = multer({
  storage: makeStorage(IMAGE_DIR),
  fileFilter: (req, file, cb) => {
    const ok = imageMimes.includes(file.mimetype) && imageExts.includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : badRequest('Invalid file type. Only JPG, PNG, WEBP or GIF images are allowed.'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
