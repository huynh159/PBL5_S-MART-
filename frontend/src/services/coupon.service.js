import api from './api';

export const couponService = {
  // Lấy danh sách mã giảm giá
  getAllCoupons: () => {
    return api.get('/coupons');
  },

  // Thêm mã giảm giá mới
  createCoupon: (couponData) => {
    return api.post('/coupons', couponData);
  },

  // Áp dụng mã giảm giá (Dành cho user)
  applyCoupon: (code) => {
    return api.get(`/coupons/apply/${code}`);
  },

  // Cập nhật mã giảm giá
  updateCoupon: (id, couponData) => {
    return api.put(`/coupons/${id}`, couponData);
  },

  // Xóa mã giảm giá
  deleteCoupon: (id) => {
    return api.delete(`/coupons/${id}`);
  }
};

