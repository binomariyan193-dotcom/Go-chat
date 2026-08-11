import axios from 'axios';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Interceptor to add JWT Auth Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
