import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationDropdown = ({ token }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  useEffect(() => {
    // click outside to close
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error('Cannot fetch notifications', e);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (e) {}
    }

    // redirect
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
           setIsOpen(!isOpen);
           if (!isOpen) fetchNotifications(); // refresh when open
        }}
        className="text-gray-600 hover:text-blue-600 relative p-2 transition flex items-center justify-center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden z-50">
          <div className="p-3 bg-gray-50 border-b font-semibold text-gray-700 flex justify-between items-center">
             Thông báo
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
               <div className="p-4 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
            ) : (
               <ul className="divide-y divide-gray-100">
                 {notifications.map((notif) => (
                   <li
                     key={notif.id}
                     onClick={() => handleNotificationClick(notif)}
                     className={`p-3 text-sm cursor-pointer hover:bg-blue-50 transition border-l-4 ${notif.isRead ? 'border-transparent text-gray-600' : 'border-blue-500 text-gray-800 bg-blue-50/30'}`}
                   >
                     <p>{notif.content}</p>
                     <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString('vi-VN')}</p>
                   </li>
                 ))}
               </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
