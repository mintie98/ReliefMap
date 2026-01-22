import axios from 'axios';
import i18n from '../i18n';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    let message = error.response?.data?.message || error.message || 'An error occurred';
    const code = error.response?.data?.code;

    if (code) {
      // Try to translate
      const key = `errors.${code}`;
      const translated = i18n.global.t(key);
      // If translation exists (doesn't equal key), use it
      if (translated && translated !== key) {
        message = translated;
      }
    }

    const err = new Error(message);
    if (code) {
      err.code = code;
    }
    return Promise.reject(err);
  }
);

export default apiClient;

