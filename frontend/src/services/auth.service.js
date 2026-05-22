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

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

export default authService;
