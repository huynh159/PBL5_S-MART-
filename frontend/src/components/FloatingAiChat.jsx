import React, { useState } from 'react';
import api from '../services/api';
import './FloatingAiChat.css';

const FloatingAiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Xin chào! Mình là AI Assistant của S-Mart. Bạn cần tư vấn sản phẩm gì hôm nay?", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/chat/ai/ask', { message: userMessage.text });
      const aiMessage = { text: response.data.answer, sender: 'ai' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [...prev, { text: 'Mình đang gặp chút sự cố kết nối AI, bạn thử lại sau nhé!', sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-container">
      {!isOpen && (
        <button className="ai-chat-button" onClick={toggleChat}>
          🤖 Hỏi AI
        </button>
      )}

      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <h4>🤖 Trợ lý AI S-Mart</h4>
            <button onClick={toggleChat}>&times;</button>
          </div>
          <div className="ai-chat-body">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="ai-message ai">Đang suy nghĩ...</div>}
          </div>
          <div className="ai-chat-footer">
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAiChat;

