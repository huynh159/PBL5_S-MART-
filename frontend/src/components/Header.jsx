import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, Package, MessageCircle, LayoutDashboard, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { jwtDecode } from 'jwt-decode';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const { token, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  // Decode role từ JWT
  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch { /* ignore */ }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-extrabold text-blue-600 flex-shrink-0">
            S<span className="text-yellow-400">-</span>Mart
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg relative hidden md:block">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Bạn muốn tìm gì hôm nay?"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            />
            <button type="submit" className="absolute left-0 top-0 bottom-0 pl-3 flex items-center text-gray-400 hover:text-blue-500">
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <NavLink to="/cart" className={({ isActive }) => `relative p-2 transition ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </NavLink>

            {token ? (
              <div className="flex items-center space-x-3">
                <NotificationDropdown token={token} />
                {/* Admin link if role is ADMIN */}
                {userRole === 'ADMIN' && (
                  <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-1 hidden sm:flex transition ${isActive ? 'text-purple-600 font-bold border-b-2 border-purple-600 pb-1' : 'text-gray-600 hover:text-purple-600'}`}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium text-sm">Admin</span>
                  </NavLink>
                )}
                {/* Home */}
                <NavLink to="/" end className={({ isActive }) => `flex items-center gap-1 hidden sm:flex transition ${isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-600 hover:text-blue-600'}`}>
                  <Home className="h-5 w-5" />
                  <span className="font-medium text-sm">Trang chủ</span>
                </NavLink>
                {/* Chat */}
                <NavLink to="/chat" className={({ isActive }) => `flex items-center gap-1 hidden sm:flex transition ${isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-600 hover:text-blue-600'}`}>
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium text-sm">Chat</span>
                </NavLink>
                {/* Orders */}
                <NavLink to="/orders" className={({ isActive }) => `flex items-center gap-1 hidden sm:flex transition ${isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-600 hover:text-blue-600'}`}>
                  <Package className="h-5 w-5" />
                  <span className="font-medium text-sm">Đơn mua</span>
                </NavLink>
                {/* Profile */}
                <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-1 transition ${isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-600 hover:text-blue-600'}`}>
                  <User className="h-5 w-5" />
                  <span className="font-medium text-sm hidden sm:inline">Tài khoản</span>
                </NavLink>
                {/* Logout */}
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-red-500 flex items-center gap-1 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium text-sm hidden md:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center space-x-2 px-4 py-2 rounded-full transition font-medium text-sm"
              >
                <User className="h-5 w-5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
