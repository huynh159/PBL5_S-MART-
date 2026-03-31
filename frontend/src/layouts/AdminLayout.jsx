import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, ShoppingBag, LogOut, FileText, Ticket } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminLayout = () => {
  const { logout, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Guard: chưa đăng nhập → về trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Guard: đăng nhập nhưng không phải ADMIN → về trang chủ
  if (!isAdmin) {
    toast.error('Bạn không có quyền truy cập trang này!');
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col transition-all">
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            S-Mart Admin
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <ShoppingBag className="w-5 h-5" />
            Sản phẩm
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <FileText className="w-5 h-5" />
            Đơn hàng
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <Users className="w-5 h-5" />
            Khách hàng
          </Link>
          <Link to="/admin/coupons" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <Ticket className="w-5 h-5" />
            Mã giảm giá
          </Link>
          <Link to="/admin/chat" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Hỗ trợ & Chat
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Cổng Quản Trị Hệ Thống</h2>
          <div className="flex items-center gap-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">ADMIN ROLE</span>
          </div>
        </header>

        {/* View Routing */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

