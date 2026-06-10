import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { MessageCircle, Send, RefreshCw, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import chatService from '../../services/chat.service';
import { io } from 'socket.io-client';
import { playNotificationSound } from '../../utils/sound';

const AdminChat = () => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Lấy adminId từ JWT – stable value, không thay đổi
  const myAdminId = useRef(null);
  if (!myAdminId.current && token) {
    try {
      const d = jwtDecode(token);
      myAdminId.current = Number(d.userId || d.id || d.sub || 1);
    } catch (_) {}
  }

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, []);

  // Khởi tạo socket một lần duy nhất
  useEffect(() => {
    fetchConversations();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminChat] Socket connected:', socket.id, 'adminId:', myAdminId.current);
      if (myAdminId.current) {
        socket.emit('register', myAdminId.current);
      }
    });

    socket.on('receiveMessage', (newMsg) => {
      const currentUser = selectedUserRef.current;
      const senderId = Number(newMsg.sender?.id ?? newMsg.senderId);
      const receiverId = Number(newMsg.receiver?.id ?? newMsg.receiverId);
      const adminId = myAdminId.current;

      const isRelatedToSelected =
        currentUser &&
        (senderId === Number(currentUser.user.id) || receiverId === Number(currentUser.user.id));

      if (senderId !== adminId) {
        playNotificationSound();
      }

      if (isRelatedToSelected) {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Đánh dấu đã đọc nếu khách vừa gửi
        if (senderId === Number(currentUser.user.id)) {
          chatService.markAsSeen(senderId).catch(console.error);
        }
      } else if (senderId !== adminId) {
        playNotificationSound();
        toast.info(`💬 Tin nhắn mới từ: ${newMsg.sender?.email || 'Khách hàng'}`);
      }

      fetchConversations();
    });

    socket.on('seenEvent', () => {
      setMessages(prev => prev.map(m => ({ ...m, status: 'SEEN' })));
    });

    socket.on('disconnect', () => console.log('[AdminChat] Socket disconnected'));

    return () => { socket.disconnect(); };
  }, []); // chỉ chạy 1 lần

  // Load lịch sử khi chọn user
  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (!selectedUser) return;

    const loadHistory = async () => {
      try {
        const data = await chatService.getChatHistory(selectedUser.user.id);
        setMessages(Array.isArray(data) ? data : []);
        await chatService.markAsSeen(selectedUser.user.id);
      } catch (err) {
        console.error('Lỗi tải lịch sử chat', err);
        toast.error('Không thể tải lịch sử chat');
      }
    };
    loadHistory();
  }, [selectedUser]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    // Optimistically mark as seen so the bold/badge disappears immediately
    if (conv.lastMessage?.status !== 'SEEN' && Number(conv.lastMessage?.receiverId) === myAdminId.current) {
      setConversations(prev => prev.map(c =>
        c.user.id === conv.user.id
          ? { ...c, lastMessage: { ...c.lastMessage, status: 'SEEN' } }
          : c
      ));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser) return;
    setSending(true);
    try {
      const msg = await chatService.sendMessage(selectedUser.user.id, content.trim());
      setMessages(prev => [...prev, msg]);
      setContent('');
      fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error('Gửi tin nhắn thất bại!');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (text, isMe) => {
    if (!text) return null;
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    if (!linkRegex.test(text)) return text;

    const parts = [];
    let lastIndex = 0;
    linkRegex.lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className={`underline font-semibold ${isMe ? 'text-white' : 'text-blue-600'}`}>
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts;
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Danh sách hội thoại */}
      <div className="w-1/3 bg-white rounded-2xl shadow-md border-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base">Hội thoại ({conversations.length})</h2>
          </div>
          <button onClick={fetchConversations} className="p-2 hover:bg-gray-200 rounded-full transition" title="Tải lại">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm italic">Chưa có cuộc trò chuyện nào</div>
          ) : (
            conversations.map(conv => {
              const UnreadBadge = conv.lastMessage.status !== 'SEEN' && Number(conv.lastMessage.receiverId) === myAdminId.current;
              return (
              <button
                key={conv.user.id}
                onClick={() => handleSelectUser(conv)}
                className={`w-full text-left p-4 flex items-center gap-3 border-l-4 transition-all duration-200 ${
                  selectedUser?.user.id === conv.user.id
                    ? 'bg-blue-50 border-blue-600 shadow-inner'
                    : UnreadBadge
                      ? 'bg-white hover:bg-gray-50 border-blue-400'
                      : 'bg-white hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                  selectedUser?.user.id === conv.user.id ? 'bg-blue-600' : 'bg-gradient-to-tr from-gray-400 to-gray-300'
                }`}>
                  <UserIcon className="w-6 h-6" />
                  {UnreadBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={`truncate text-sm ${UnreadBadge ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{conv.user.email}</p>
                    <p className={`text-[10px] ml-2 flex-shrink-0 ${UnreadBadge ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>{formatTime(conv.lastMessage.createdAt)}</p>
                  </div>
                  <p className={`text-sm truncate ${UnreadBadge ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{conv.lastMessage.content}</p>
                </div>
              </button>
            )})
          )}
        </div>
      </div>

      {/* Khung chat */}
      <div className="flex-1 bg-white rounded-2xl shadow-md border-0 flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">{selectedUser.user.email}</p>
                <p className="text-xs text-blue-100">ID: {selectedUser.user.id}</p>
              </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có tin nhắn</div>
              )}
              {messages.map((msg, i) => {
                const senderId = Number(msg.sender?.id ?? msg.senderId);
                const isMe = senderId === myAdminId.current;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group ${
                      isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                    }`}>
                      <p className="break-words leading-relaxed">{renderMessageContent(msg.content, isMe)}</p>
                      <div className={`flex items-center gap-1 mt-1.5 text-[10px] opacity-70 ${isMe ? 'justify-end text-blue-100' : 'justify-start text-gray-500'}`}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && (msg.status === 'SEEN'
                          ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                          : <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  type="text"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                  className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full outline-none text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-inner"
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none transition-all font-semibold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <MessageCircle className="w-14 h-14 text-blue-200" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-500">Chọn một hội thoại</p>
              <p className="text-sm">để bắt đầu trả lời khách hàng</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;

