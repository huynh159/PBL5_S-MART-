import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import chatService from '../services/chat.service';

export const useUnreadChat = (token) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const checkUnread = async () => {
      try {
        const data = await chatService.getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {
        console.error('Lỗi lấy số tin nhắn chưa đọc', e);
      }
    };
    checkUnread();

    const handleLocalRead = () => checkUnread();
    window.addEventListener('chatRead', handleLocalRead);

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    try {
        const decoded = jwtDecode(token);
        const uid = decoded.userId || decoded.id || decoded.sub;
        if (uid) {
            socket.on('connect', () => socket.emit('register', uid));
            socket.on('receiveMessage', (msg) => {
                if (Number(msg.receiverId) === Number(uid)) {
                    checkUnread();
                }
            });
            // We don't reset count on 'seenEvent' because that means our sent message was seen.
        }
    } catch (e) {}

    return () => { 
        socket.disconnect(); 
        window.removeEventListener('chatRead', handleLocalRead);
    };
  }, [token]);

  return unreadCount;
};
