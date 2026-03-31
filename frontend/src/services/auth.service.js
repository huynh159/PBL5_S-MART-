import api from './api';

const authService = {
  register: async (email, password) => {
    return await api.post('/auth/register', { email, password });
  },

  verifyOtp: async (email, otp) => {
    return await api.post('/auth/verify-otp', { email, otp });
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  googleLogin: async (idToken) => {
    const response = await api.post('/auth/google-login', { idToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (email, otp, newPassword) => {
    return await api.post('/auth/reset-password', { email, otp, newPassword });
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

export default authService;
