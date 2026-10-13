import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://job-portal-1-u8jw.onrender.com/api/v1';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any failure into an Error with .message / .status / .errors (and .response.data for old code)
const normalizeError = (error) => {
  const data = error.response?.data;
  const err = new Error(data?.message || (error.request ? 'Cannot reach the server. Is the backend running?' : error.message) || 'Something went wrong');
  err.status = error.response?.status;
  err.errors = data?.errors;
  err.data = data;
  err.response = { data, status: err.status };
  return err;
};

// Several requests can fail with 401 at the same moment; refresh only once.
let refreshing = null;
const refreshAccessToken = () => {
  if (!refreshing) {
    refreshing = axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error('No token');
        localStorage.setItem('accessToken', token);
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const isAuthCall = AUTH_URLS.some((u) => original?.url?.includes(u));

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      } catch {
        // Session is over. Route guards send the user to /login.
        localStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

export default axiosClient;
