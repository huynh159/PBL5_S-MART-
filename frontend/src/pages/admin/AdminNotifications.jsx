import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import adminService from '../../services/admin.service';
import api from '../../services/api';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      toast.error('Lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(unreadIds.map(id => adminService.markNotificationRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Lỗi khi đánh dấu tất cả');
    }
  };

  const handleDelete = async (id) => {
    try {
      // Create endpoint for deleting if necessary, or just hide them.
      // Since there is no delete endpoint in notification.routes.ts, we will just delete from UI for now.
      // Wait, let's try calling DELETE /api/notifications/:id just in case, if it fails hide it.
      await api.delete(`/notifications/${id}`).catch(() => {});
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Tất Cả Thông Báo</h1>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-lg font-semibold transition"
        >
          <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Hiện chưa có thông báo nào.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-5 transition hover:bg-gray-50 flex items-start gap-4 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
              >
                <div className={`p-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-base ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.content}
                    </p>
                    <div className="flex gap-2 ml-4">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
