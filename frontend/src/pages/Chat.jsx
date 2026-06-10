import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MessageCircle, Send, RefreshCw, Check, CheckCheck, MoreVertical } from 'lucide-react';
import chatService from '../services/chat.service';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

const Chat = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const [adminId, setAdminId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Initialize content from product context
  useEffect(() => {
    if (location.state?.productId && location.state?.productName) {
      setTimeout(() => {
        setContent(`Xin chào Shop, tôi muốn hỏi về sản phẩm: [${location.state.productName}](${location.state.productLink})`);
      }, 500); 
    }
  }, [location.state]);

  // Fetch Admin ID
  useEffect(() => {
    chatService.getAdminId()
      .then(data => {
        const id = data?.adminId || data;
        setAdminId(Number(id));
        console.log('[Chat] Admin ID:', id);
      })
      .catch(console.error);
  }, []);

  // Get userId from JWT
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    try {
      const decoded = jwtDecode(token);
      const uid = decoded.userId || decoded.id || decoded.sub;
      setMyUserId(uid);
    } catch (e) {
      console.error('Cannot decode token', e);
    }
  }, [token, navigate]);

  const loadHistory = async () => {
    if (!adminId) return;
    try {
      const data = await chatService.getChatHistory(adminId);
      setMessages(data || []);
      await chatService.markAsSeen(adminId);
    } catch (err) {
      console.error('Lỗi tải lịch sử chat', err);
    }
  };

  useEffect(() => {
    if (adminId) {
      loadHistory();
    }
  }, [adminId]);

  useEffect(() => {
    if (!myUserId) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected');
      socket.emit('register', myUserId);
    });

    socket.on('receiveMessage', (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      const senderId = newMsg.sender?.id || newMsg.senderId;
      if (String(senderId) !== String(myUserId) && adminId) {
          chatService.markAsSeen(adminId).catch(console.error);
      }
    });

    socket.on('seenEvent', () => {
      setMessages(prev => prev.map(m => ({ ...m, status: 'SEEN' })));
    });

    socket.on('messageRecalled', (updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });

    return () => {
      socket.disconnect();
    };
  }, [myUserId, adminId]);

  const handleRecall = async (msgId) => {
    try {
      const updatedMsg = await chatService.recallMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg.data || updatedMsg : m));
      setActiveDropdown(null);
    } catch (err) {
      toast.error('Không thể thu hồi tin nhắn');
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !adminId) return;
    setSending(true);
    try {
      const msg = await chatService.sendMessage(adminId, content.trim());
      setMessages(prev => [...prev, msg]);
      setContent('');
    } catch (err) {
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
    <div className="max-w-2xl mx-auto mt-6 mb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: '75vh' }}>
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Chat với S-Mart Support</p>
              <p className="text-xs text-blue-100">Hỗ trợ 24/7</p>
            </div>
          </div>
          <button onClick={() => { if (adminId) loadHistory(); }} className="p-2 hover:bg-white/20 rounded-full transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
              <p>Chưa có tin nhắn nào.</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const senderId = msg.sender?.id || msg.senderId;
            const isMe = String(senderId) === String(myUserId);
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-2`}>
                {isMe && msg.status !== 'RECALLED' && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pr-2 relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === msg.id ? null : msg.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === msg.id && (
                      <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-50 min-w-[120px]">
                        <button onClick={() => handleRecall(msg.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                          Thu hồi
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.status === 'RECALLED' ? 'bg-transparent border border-gray-200 text-gray-400 italic rounded-md' : isMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'}`}>
                  <p className="break-words leading-relaxed">{renderMessageContent(msg.content, msg.status === 'RECALLED' ? false : isMe)}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.status === 'RECALLED' ? 'text-gray-400' : isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                     <span>{formatTime(msg.createdAt)}</span>
                     {isMe && msg.status !== 'RECALLED' && (msg.status === 'SEEN' ? <CheckCheck className="w-3 h-3 text-green-300" /> : <Check className="w-3 h-3" />)}
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <form onSubmit={handleSend} className="flex gap-3">
            <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-400 outline-none text-sm" disabled={sending} />
            <button type="submit" disabled={sending || !content.trim()} className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
