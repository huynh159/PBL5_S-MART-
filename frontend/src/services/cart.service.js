import api from './api';

const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (payload) => {
    // payload can be { productId, quantity, color, size, price }
    const response = await api.post('/cart', payload);
    return response.data;
  },

  updateCartItem: async (cartItemId, quantity) => {
    const response = await api.put(`/cart/${cartItemId}`, null, {
      params: { quantity }
    });
    return response.data;
  },

  removeCartItem: async (cartItemId) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
};

export default cartService;
