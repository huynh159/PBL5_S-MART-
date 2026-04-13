import api from './api';

const productService = {
  getProducts: async (page = 0, size = 12, search = '', categoryId = null) => {
    const params = { page, size };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;

    const response = await api.get('/products', {
      params
    });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getProductDetail: async (id) => {
    const response = await api.get(`/products/${id}/detail`);
    return response.data;
  },

  getProductReviews: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response.data;
  },

  getProductReviewStats: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}/stats`);
    return response.data;
  },

  getProductsByCategory: async (categoryId) => {
    const response = await api.get(`/products/category/${categoryId}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Admin CRUD
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getSimilarProducts: async (id) => {
    try {
      const response = await api.get(`/products/${id}/recommend`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default productService;
