import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShoppingBag, FileText, DollarSign as DollarIcon, 
  ArrowUpRight, ArrowDownRight, TrendingUp, 
  Package, CheckCircle, Clock, Bell, Ticket
} from 'lucide-react';
import adminService from '../../services/admin.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

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
    PENDING: { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
    PAID: { label: 'Đã thanh toán', color: '#14b8a6', icon: CheckCircle },
    CONFIRMED: { label: 'Đang chuẩn bị', color: '#8b5cf6', icon: Package },
    SHIPPING: { label: 'Đang giao', color: '#0ea5e9', icon: TrendingUp },
    DELIVERED: { label: 'Thành công', color: '#22c55e', icon: CheckCircle },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444', icon: ArrowDownRight },
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
      setLoading(true);
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

    socket.on('connect', () => setWsStatus('connected'));
    socket.on('adminNotification', (msg) => {
      setNotifications(prev => [msg.content || msg, ...prev]);
    });
    socket.on('disconnect', () => setWsStatus('disconnected'));

    return () => { socket.disconnect(); };
  }, []);

  const STAT_CARDS = [
    { key: 'totalUsers',    label: 'Khách hàng',  icon: Users,       color: 'indigo',   trend: '+12.5%' },
    { key: 'totalProducts', label: 'Sản phẩm',    icon: ShoppingBag, color: 'purple',   trend: '+4.2%' },
    { key: 'totalOrders',   label: 'Đơn hàng',    icon: FileText,    color: 'orange',   trend: '+18.1%' },
    { key: 'totalRevenue',  label: 'Doanh thu',   icon: DollarIcon,  color: 'emerald',  trend: '+22.4%' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Chào mừng bạn quay trở lại, đây là những gì đang diễn ra với S-Mart.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <button className="px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-600 rounded-xl transition-all">Hôm nay</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-all">7 ngày qua</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {STAT_CARDS.map((c) => {
          const IconComp = c.icon || ShoppingBag;
          const val = stats[c.key];
          return (
            <motion.div 
              key={c.key} 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card-premium relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
                <IconComp className="w-full h-full rotate-12" />
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${c.color}-50 text-${c.color}-600`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  {c.trend}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">{c.label}</p>
                <p className="text-3xl font-black text-slate-800 font-display">
                  {loading ? (
                    <span className="inline-block w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
                  ) : c.key === 'totalRevenue'
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)
                    : val || 0
                  }
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 card-premium">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Doanh Thu Theo Tháng
            </h2>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))} 
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {(stats.availableYears || [new Date().getFullYear()]).map(year => (
                <option key={year} value={year}>Năm {year}</option>
              ))}
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByMonth || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}}
                  tickFormatter={(value) => new Intl.NumberFormat('vi-VN', {notation: "compact"}).format(value)} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card-premium">
          <h2 className="text-xl font-black text-slate-800 mb-8 font-display">Tỉ Lệ Đơn Hàng</h2>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={normalizedOrderStatusStats} 
                  cx="50%" cy="50%" 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="value" 
                  nameKey="name"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {normalizedOrderStatusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ORDER_STATUS_META[entry.name]?.color || '#94a3b8'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [value, ORDER_STATUS_META[name]?.label || name]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 font-display">{stats.totalOrders || 0}</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tổng Đơn</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {normalizedOrderStatusStats.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ORDER_STATUS_META[item.name]?.color }}></div>
                  <span className="text-slate-600 font-medium">{ORDER_STATUS_META[item.name]?.label}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="card-premium flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 font-display">
              <Bell className="w-5 h-5 text-amber-500" />
              Thông Báo Mới Nhất
            </h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${wsStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {wsStatus === 'connected' ? 'Live' : 'Offline'}
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">Chưa có hoạt động nào mới...</p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4 transition-all hover:bg-white hover:shadow-md hover:border-transparent group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{notif}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vừa xong</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card-premium">
            <h2 className="text-xl font-black text-slate-800 mb-6 font-display flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500" />
                Hành Động Nhanh
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Thêm SP</span>
                </button>
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Ticket className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Tạo Mã</span>
                </button>
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-orange-50 hover:border-orange-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Giao Hàng</span>
                </button>
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Báo Cáo</span>
                </button>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
