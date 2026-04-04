import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ShoppingBag, FileText, DollarSign, Bell, BellOff } from 'lucide-react';
import adminService from '../../services/admin.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
  const stompClientRef = useRef(null);

  // Fetch stats
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

  // Load notification history + WebSocket
  useEffect(() => {
    // Load lịch sử thông báo
    adminService.getNotifications()
      .then(data => setNotifications(Array.isArray(data) ? data.map(n => n.content) : []))
      .catch(() => {});

    // Kết nối WebSocket với dynamic import
    Promise.all([
      import('@stomp/stompjs'),
      import('sockjs-client')
    ]).then(([{ Client }, SockJSModule]) => {
      const SockJS = SockJSModule.default || SockJSModule;
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
          setWsStatus('connected');
          client.subscribe('/topic/admin-notifications', (msg) => {
            setNotifications(prev => [msg.body, ...prev]);
          });
        },
        onDisconnect: () => setWsStatus('disconnected'),
        onStompError: () => setWsStatus('disconnected'),
      });
      client.activate();
      stompClientRef.current = client;
    }).catch(err => {
      console.error('WebSocket init error', err);
      setWsStatus('disconnected');
    });

    return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
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

      {/* Stat Cards */}
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

      {/* Charts Section */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Revenue Area Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Doanh thu theo tháng</h2>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {(stats.availableYears || [new Date().getFullYear()]).map(year => (
                  <option key={year} value={year}>Năm {year}</option>
                ))}
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByMonth || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', {notation: "compact", compactDisplay: "short"}).format(value)} />
                  <Tooltip
                    formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    labelStyle={{color: '#374151'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Doanh thu" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trạng thái đơn hàng</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.orderStatusStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(stats.orderStatusStats || []).map((entry, index) => {
                       const colors = {
                         PENDING: '#f59e0b',
                         CONFIRMED: '#8b5cf6',
                         SHIPPING: '#0ea5e9',
                         DELIVERED: '#22c55e',
                         CANCELLED: '#ef4444'
                       };
                       return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [value + ' đơn', 'Số lượng']} />
                  <Legend
                    formatter={(value) => {
                      const labels = {
                        PENDING: 'Chờ xử lý',
                        CONFIRMED: 'Đã xác nhận',
                        SHIPPING: 'Đang giao',
                        DELIVERED: 'Thành công',
                        CANCELLED: 'Đã hủy'
                      };
                      return labels[value] || value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            Thông Báo Hệ Thống (Real-time)
          </h2>
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            wsStatus === 'connected' ? 'bg-green-100 text-green-700' :
            wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {wsStatus === 'connected' ? <><span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" /> Đã kết nối</> :
             wsStatus === 'connecting' ? 'Đang kết nối...' :
             <><BellOff className="w-3.5 h-3.5" /> Mất kết nối</>}
          </span>
        </div>
        <div className="p-6 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Chưa có thông báo mới...</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notif, i) => (
                <li key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                  <span className="text-blue-400 mr-2">🔔</span>{notif}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
