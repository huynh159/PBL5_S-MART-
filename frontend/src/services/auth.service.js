import axios from 'axios';

// URL cơ sở của Backend (Base URL)
const API_URL = 'http://localhost:8080/api/auth';

const authService = {
  // Thay vì gọi trực tiếp axios khắp nơi, ta gó gọn vào 1 nơi (Encapsulation)
  register: async (email, password) => {
    return await axios.post(`${API_URL}/register`, { email, password });
  },

  verifyOtp: async (email, otp) => {
    return await axios.post(`${API_URL}/verify-otp`, { email, otp });
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    // Nếu có token, lưu vào bộ nhớ cục bộ (Local Storage)
    if (response.data.token) {
      localStorage.setItem('user_token', response.data.token);
      localStorage.setItem('user_email', email);
    }
    return response.data;
  },

  googleLogin: async (idToken) => {
    const response = await axios.post(`${API_URL}/google-login`, { idToken });
    if (response.data.token) {
      localStorage.setItem('user_token', response.data.token);
      // user_email có thể parse từ JWT nếu cần, hoặc lưu tạm
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    return await axios.post(`${API_URL}/forgot-password`, { email });
  },

  resetPassword: async (email, otp, newPassword) => {
    return await axios.post(`${API_URL}/reset-password`, { email, otp, newPassword });
  },

  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_email');
  },
};

export default authService;
