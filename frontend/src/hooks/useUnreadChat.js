import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import chatService from '../services/chat.service';

export const useUnreadChat = (token) => {
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!token) return;

    const checkUnread = async () => {
      try {
        const convs = await chatService.getConversations();
        const decoded = jwtDecode(token);
        const myId = decoded.userId || decoded.id || decoded.sub;
        const unread = convs.some(c => c.lastMessage.status !== 'SEEN' && Number(c.lastMessage.receiverId) === Number(myId));
        setHasUnreadChat(unread);
      } catch (e) {}
    };
    checkUnread();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    try {
        const decoded = jwtDecode(token);
        const uid = decoded.userId || decoded.id || decoded.sub;
        if (uid) {
            socket.on('connect', () => socket.emit('register', uid));
            socket.on('receiveMessage', (msg) => {
                if (Number(msg.receiverId) === Number(uid)) {
                    // Show badge if not on chat page
                    if (!window.location.pathname.includes('/chat')) {
                        setHasUnreadChat(true);
                    }
                }
            });
            socket.on('seenEvent', () => setHasUnreadChat(false));
        }
    } catch (e) {}

    return () => { socket.disconnect(); };
  }, [token]);

  return location.pathname.includes('/chat') ? false : hasUnreadChat;
};
