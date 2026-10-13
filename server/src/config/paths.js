import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// <server>/uploads  -> always the same folder no matter where `node` was started from
export const UPLOAD_ROOT = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
export const RESUME_DIR = path.join(UPLOAD_ROOT, 'resumes');
export const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images');

// Convert "/uploads/resumes/abc.pdf" -> absolute path on disk
export const urlToDiskPath = (fileUrl = '') =>
  path.join(UPLOAD_ROOT, fileUrl.replace(/^\/?uploads\/?/, ''));
