import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, ShoppingBag, LogOut, 
  FileText, Ticket, MessageSquare, Search,
  ChevronRight, UserCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import NotificationDropdown from '../components/NotificationDropdown';
import { motion } from 'framer-motion';
import { useUnreadChat } from '../hooks/useUnreadChat';

const MotionDiv = motion.div;

const AdminLayout = () => {
  const { logout, token, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const hasUnreadChat = useUnreadChat(token);

  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    toast.error('Bạn không có quyền truy cập trang này!');
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    navigate('/login');
  };

  const menuItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: ShoppingBag, label: 'Sản phẩm' },
    { to: '/admin/orders', icon: FileText, label: 'Đơn hàng' },
    { to: '/admin/users', icon: Users, label: 'Khách hàng' },
    { to: '/admin/coupons', icon: Ticket, label: 'Mã giảm giá' },
    { to: '/admin/chat', icon: MessageSquare, label: 'Hỗ trợ & Chat' },
    { to: '/admin/profile', icon: UserCircle, label: 'Ho so' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glass-dark text-white flex flex-col z-20 relative shadow-2xl">
        <div className="h-20 flex items-center px-8 border-b border-slate-700/50 mb-4">
          <MotionDiv 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <h1 className="text-xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              S-MART <span className="text-indigo-400">PRO</span>
            </h1>
          </MotionDiv>
        </div>

        {/* Admin Profile Mini */}
        <div className="px-6 mb-8">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
              A
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate">Administrator</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink 
              key={item.to}
              end={item.end}
              to={item.to} 
              className={({ isActive }) => `
                group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 relative
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3.5 relative">
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
                <span className="font-medium tracking-wide">{item.label}</span>
                {item.to === '/admin/chat' && hasUnreadChat && (
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                )}
              </div>
              <ChevronRight className={`w-4 h-4 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1`} />
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header Overlay (Dynamic) */}
        <header className="h-20 glass sticky top-0 flex items-center justify-between px-10 z-30 shadow-sm border-b border-slate-200/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh hệ thống..." 
                className="w-full bg-slate-100/50 border-none rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <NotificationDropdown token={token} />
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Hệ Thống</span>
              <span className="text-[10px] text-slate-400 font-medium">v1.2.0 - Premium</span>
            </div>
          </div>
        </header>

        {/* View Routing with Animation */}
        <div className="flex-1 overflow-auto bg-slate-50/50 custom-scrollbar">
          <MotionDiv 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-10"
          >
            <Outlet />
          </MotionDiv>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
