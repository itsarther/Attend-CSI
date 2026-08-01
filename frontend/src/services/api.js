import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csi_auth_token');
    if (token) {
      if (config.headers.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Detect if SPA HTML was returned instead of JSON for API call
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      return Promise.reject({
        response: {
          data: { detail: 'API endpoint misconfigured or server starting up. Please try again.' }
        }
      });
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.detail || 'An unexpected error occurred';
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('csi_auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;
