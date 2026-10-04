import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'Request failed';
    const error = new Error(message);
    error.status = err.response?.status;
    error.code = err.response?.data?.error?.code;
    error.payload = err.response?.data;
    if (error.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('pp_token');
    }
    return Promise.reject(error);
  }
);

export default api;
