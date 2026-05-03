import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ShoppingBag, FileText, DollarSign, Bell, BellOff } from 'lucide-react';
import adminService from '../../services/admin.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    orderStatusStats: [], revenueByMonth: [], availableYears: [], selectedYear: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [notifications, setNotifications] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const { token } = useAuth();
  const socketRef = useRef(null);

  const ORDER_STATUS_META = {
    PENDING: { label: 'Chờ xác nhận', color: '#f59e0b' },
    CONFIRMED: { label: 'Đang chuẩn bị', color: '#8b5cf6' },
    SHIPPING: { label: 'Đang giao', color: '#0ea5e9' },
    DELIVERED: { label: 'Thành công', color: '#22c55e' },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
  };

  const normalizedOrderStatusStats = Object.keys(ORDER_STATUS_META).map((status) => {
    const raw = (stats.orderStatusStats || []).find((s) => String(s.name).toUpperCase() === status);
    return {
      name: status,
      value: Number(raw?.value || 0),
    };
  }).filter((item) => item.value > 0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats(selectedYear);
        setStats(data);
      } catch (err) {
        console.error('Lỗi lấy thống kê', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token, selectedYear]);

  useEffect(() => {
    adminService.getNotifications()
      .then(data => setNotifications(Array.isArray(data) ? data.map(n => n.content) : []))
      .catch(() => {});

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socketRef.current = socket;

    socket.on('connect', () => {
      setWsStatus('connected');
    });

    socket.on('adminNotification', (msg) => {
      setNotifications(prev => [msg.content || msg, ...prev]);
    });

    socket.on('disconnect', () => setWsStatus('disconnected'));

    return () => { socket.disconnect(); };
  }, []);

  const STAT_CARDS = [
    { key: 'totalUsers',    label: 'Khách hàng',  icon: Users,       bg: 'bg-blue-100/60',   text: 'text-blue-600' },
    { key: 'totalProducts', label: 'Sản phẩm',    icon: ShoppingBag, bg: 'bg-purple-100/60', text: 'text-purple-600' },
    { key: 'totalOrders',   label: 'Đơn hàng',    icon: FileText,    bg: 'bg-orange-100/60', text: 'text-orange-600' },
    { key: 'totalRevenue',  label: 'Doanh thu',   icon: DollarSign,  bg: 'bg-green-100/60',  text: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tổng Quan (Dashboard)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map(c => {
          const IconComp = c.icon;
          const val = stats[c.key];
          return (
            <div key={c.key} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-gray-100">
              <div className={`p-4 ${c.bg} ${c.text} rounded-full`}>
                <IconComp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{c.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : c.key === 'totalRevenue'
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
                    : val || 0
                  }
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Doanh thu theo tháng</h2>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none">
                {(stats.availableYears || [new Date().getFullYear()]).map(year => (
                  <option key={year} value={year}>Năm {year}</option>
                ))}
              </select>
            </div>
            <div className="h-72 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN', {notation: "compact"}).format(value)} />
                  <Tooltip
                    formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    labelFormatter={(label) => `Tháng ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trạng thái đơn hàng</h2>
            <div className="h-72 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={normalizedOrderStatusStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="name">
                    {normalizedOrderStatusStats.map((entry, index) => <Cell key={`cell-${index}`} fill={ORDER_STATUS_META[entry.name]?.color || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, ORDER_STATUS_META[name]?.label || name]} />
                  <Legend formatter={(value) => ORDER_STATUS_META[value]?.label || value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-500" />Thông Báo</h2>
          <span className={`text-sm px-2 py-1 rounded-full ${wsStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {wsStatus === 'connected' ? 'Đã kết nối' : 'Mất kết nối'}
          </span>
        </div>
        <div className="p-6 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? <p className="text-gray-400 text-center py-8">Chưa có thông báo mới...</p> : (
            <ul className="space-y-2">
              {notifications.map((notif, i) => (
                <li key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">🔔 {notif}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
