import api from './api';

const adminService = {
  getStats: async (year = null, range = 'year', startDate = null, endDate = null) => {
    const response = await api.get('/admin/stats', {
      params: { year, range, startDate, endDate }
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleLockUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/toggle-lock`);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Admin Orders
  getAllOrders: async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  // Coupons
  getCoupons: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post('/admin/coupons', couponData);
    return response.data;
  },

  toggleCoupon: async (id) => {
    const response = await api.put(`/admin/coupons/${id}/toggle`);
    return response.data;
  },
};

export default adminService;
