import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MessageCircle, Send, RefreshCw, Check, CheckCheck } from 'lucide-react';
import chatService from '../services/chat.service';
import { jwtDecode } from 'jwt-decode';

const Chat = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const [adminId, setAdminId] = useState(null);

  // Fetch Admin ID
  useEffect(() => {
    chatService.getAdminId().then(setAdminId).catch(console.error);
  }, []);

  // Lấy userId từ JWT
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
      // Khi mở lịch sử, đánh dấu đã xem tất cả tin nhắn
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

    let isActive = true;
    let client = null;

    Promise.all([
      import('@stomp/stompjs'),
      import('sockjs-client')
    ]).then(([{ Client }, SockJSModule]) => {
      if (!isActive) return;
      const SockJS = SockJSModule.default || SockJSModule;
      client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        debug: (str) => console.log('STOMP: ' + str),
        onConnect: () => {
          client.subscribe(`/topic/messages/${myUserId}`, (message) => {
            const newMsg = JSON.parse(message.body);
            
            if (newMsg.type === 'SEEN_EVENT') {
                 setMessages(prev => prev.map(m => ({ ...m, status: 'SEEN' })));
                 return;
            }

            setMessages(prev => {
               if (prev.find(m => m.id === newMsg.id)) return prev;
               return [...prev, newMsg];
            });

            // Nếu người gửi là Admin, đánh dấu đã xem
            const senderId = newMsg.sender?.id || newMsg.senderId;
            if (String(senderId) !== String(myUserId) && adminId) {
                chatService.markAsSeen(adminId).catch(console.error);
            }
          });
        },
        onStompError: (frame) => {
          console.error('STOMP error', frame);
        },
      });
      client.activate();
      stompClientRef.current = client;
    }).catch(err => console.error('WebSocket init error', err));

    return () => { 
        isActive = false;
        if (client) {
            client.deactivate();
        } else if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId, adminId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="max-w-2xl mx-auto mt-6 mb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: '75vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Chat với S-Mart Support</p>
              <p className="text-xs text-blue-100">Hỗ trợ 24/7 • Thường phản hồi trong vài phút</p>
            </div>
          </div>
          <button
            onClick={() => { if (adminId) loadHistory(); }}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
              <p>Chưa có tin nhắn nào. Hãy gửi lời hỏi thăm!</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const senderId = msg.sender?.id || msg.senderId;
            const isMe = String(senderId) === String(myUserId);
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                }`}>
                  <p>{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                     <span>{formatTime(msg.createdAt)}</span>
                     {isMe && (
                        msg.status === 'SEEN' ? <CheckCheck className="w-3 h-3 text-green-300" /> : <Check className="w-3 h-3" />
                     )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-400 outline-none text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
