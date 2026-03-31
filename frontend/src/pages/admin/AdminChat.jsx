import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { MessageCircle, Send, RefreshCw, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import chatService from '../../services/chat.service';

const AdminChat = () => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [myAdminId, setMyAdminId] = useState(1);
  const [stompClient, setStompClient] = useState(null);
  
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const selectedUserRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  // Initialize
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setMyAdminId(decoded.userId || decoded.id || decoded.sub || 1);
      } catch (e) {
        console.error('Cannot decode token', e);
      }
    }
    
    fetchConversations();

    // Setup Websocket for Admin (myAdminId)
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
          client.subscribe(`/topic/messages/${myAdminId}`, (message) => {
            const newMsg = JSON.parse(message.body);
            
            if (newMsg.type === 'SEEN_EVENT') {
                 setMessages(prev => prev.map(m => ({ ...m, status: 'SEEN' })));
                 return;
            }

            const currentUser = selectedUserRef.current;
            const senderId = newMsg.sender?.id || newMsg.senderId;
            const receiverId = newMsg.receiver?.id || newMsg.receiverId;
            
            if (currentUser && (senderId === currentUser.userId || receiverId === currentUser.userId)) {
                 setMessages(prev => {
                     if (prev.find(m => m.id === newMsg.id)) return prev;
                     return [...prev, newMsg];
                 });
                 if (senderId === currentUser.userId) {
                     chatService.markAsSeen(senderId).catch(console.error);
                 }
            } else if (senderId !== myAdminId) {
                 toast.info(`Tin nhắn mới từ Khách hàng`);
            }
            
            // Re-fetch conversations to update order and unread count
            fetchConversations();
          });
        },
        onStompError: (frame) => console.error('STOMP error', frame),
      });
      client.activate();
      stompClientRef.current = client;
      setStompClient(client);
    }).catch(err => console.error('WebSocket init error', err));

    return () => { 
        isActive = false;
        if (client) {
            client.deactivate();
        } else if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
    };
  }, [token, myAdminId]);

  // Load chat history when user is selected
  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (!selectedUser) return;
    const loadHistory = async () => {
      try {
        const data = await chatService.getChatHistory(selectedUser.userId);
        setMessages(data || []);
        
        // Cập nhật đã xem nếu có tin nhắn mới
        if (selectedUser.unreadCount > 0) {
            await chatService.markAsSeen(selectedUser.userId);
            fetchConversations();
        }
      } catch (err) {
        toast.error('Lỗi tải lịch sử chat');
      }
    };
    loadHistory();
  }, [selectedUser]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser) return;
    setSending(true);
    try {
      const msg = await chatService.sendMessage(selectedUser.userId, content.trim());
      setMessages(prev => [...prev, msg]);
      setContent('');
      fetchConversations(); // Update my last message in sidebar
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
    <div className="flex h-[calc(100vh-8rem)] gap-6 antialiased text-gray-800">
      
      {/* Users List Sidebar */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg">Hội thoại</h2>
          </div>
          <button onClick={fetchConversations} className="p-2 hover:bg-gray-200 rounded-full transition">
              <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
           {conversations.length === 0 ? (
               <div className="p-4 text-center text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</div>
           ) : (
             <ul className="divide-y divide-gray-50">
               {conversations.map(u => (
                 <li key={u.userId}>
                   <button
                     onClick={() => setSelectedUser(u)}
                     className={`w-full text-left p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors ${selectedUser?.userId === u.userId ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                   >
                     <div className={`relative w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center text-white ${selectedUser?.userId === u.userId ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <UserIcon className="w-6 h-6" />
                        {u.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                            {u.unreadCount > 9 ? '9+' : u.unreadCount}
                          </span>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-baseline mb-0.5">
                         <p className={`font-semibold truncate text-sm ${u.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{u.email}</p>
                         <p className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(u.lastUpdate)}</p>
                       </div>
                       <p className={`text-xs truncate ${u.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                         {u.lastMessage || 'Bắt đầu trò chuyện'}
                       </p>
                     </div>
                   </button>
                 </li>
               ))}
             </ul>
           )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">{selectedUser.email}</p>
                  <p className="text-xs text-blue-100">{selectedUser.isActive ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
                  <p>Chưa có tin nhắn nào với khách hàng này.</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const senderId = msg.sender?.id || msg.senderId;
                const isMe = String(senderId) === String(myAdminId);
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                    }`}>
                      <p className="break-words">{msg.content}</p>
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

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center font-semibold gap-2 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                  Gửi
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-500">Chọn một cuộc hội thoại để phản hồi</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminChat;
