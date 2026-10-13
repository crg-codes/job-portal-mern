const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Files (logos, avatars, resumes) are served by the API server, not by Vite
export const API_ROOT = API_BASE.replace(/\/api\/v1\/?$/, '');

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ROOT}${path.startsWith('/') ? '' : '/'}${path}`;
};
