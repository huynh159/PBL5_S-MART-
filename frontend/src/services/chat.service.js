import api from './api';

const chatService = {
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/chat/send', { receiverId, content });
    return response.data;
  },

  getChatHistory: async (receiverId) => {
    const response = await api.get(`/chat/history/${receiverId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  markAsSeen: async (senderId) => {
    const response = await api.put(`/chat/mark-seen/${senderId}`);
    window.dispatchEvent(new Event('chatRead'));
    return response.data;
  },

  getAdminId: async () => {
    const response = await api.get('/chat/admin-id');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  recallMessage: async (id) => {
    const response = await api.put(`/chat/${id}/recall`);
    return response.data;
  },
};

export default chatService;
