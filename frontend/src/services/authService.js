import apiClient from './api';

export default {
  async login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },

  async register(data) {
    return apiClient.post('/auth/register', data);
  },

  async googleLogin(token) {
    return apiClient.post('/auth/google', { token });
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
};
