import api from './api';

const orderService = {
  getMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  applyCoupon: async (code) => {
    const response = await api.get(`/coupons/apply/${code}`);
    return response.data;
  },

  createVnpayPayment: async (orderId) => {
    const response = await api.post(`/payment/vnpay/create-payment?orderId=${orderId}`);
    return response.data;
  },
};

export default orderService;
