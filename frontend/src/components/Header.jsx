import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Search, LogOut, Package, 
  MessageCircle, LayoutDashboard, Home, Sparkles, X,
  Menu, ChevronDown, Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { jwtDecode } from 'jwt-decode';
import NotificationDropdown from './NotificationDropdown';
import productService from '../services/product.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadChat } from '../hooks/useUnreadChat';

const Header = () => {
  const { token, logout } = useAuth();
  const { cartCount } = useCart();
  const hasUnreadChat = useUnreadChat(token);
  const [searchInput, setSearchInput] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const suggestRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!searchInput.trim() || searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        let data;
        if (aiMode) {
          data = await productService.searchByAI(searchInput.trim(), 5);
        } else {
          data = await productService.getProducts(0, 5, searchInput.trim());
        }
        const items = data.content || [];
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, aiMode ? 600 : 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, aiMode]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setShowSuggestions(false);
      navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const navLinks = [
    { to: '/', label: 'Trang Chủ', icon: Home, end: true },
    { to: '/chat', label: 'Hỗ Trợ', icon: MessageCircle },
    { to: '/orders', label: 'Đơn Mua', icon: Package },
    { to: '/vouchers', label: 'Kho Voucher', icon: Ticket },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'glass py-2' : 'bg-white py-4'} border-b border-slate-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-8">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-2xl font-display font-black tracking-tighter text-slate-900">
              M<span className="text-indigo-600">A</span>RT
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `
                  relative py-1 text-sm font-bold tracking-wide transition-all duration-300
                  ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}
                  after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 
                  after:bg-indigo-600 after:scale-x-0 after:transition-transform after:duration-300
                  ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-50'}
                `}
              >
                {link.label}
                {link.to === '/chat' && hasUnreadChat && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                )}
              </NavLink>
            ))}
            {userRole === 'ADMIN' && (
              <Link to="/admin" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full transition-all">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Search Bar */}
          <div ref={suggestRef} className="flex-1 max-w-md relative hidden md:block">
            <form onSubmit={handleSearch} className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${aiMode ? 'text-indigo-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
                {aiMode ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder={aiMode ? 'AI: "Tìm giày chạy bộ dưới 2 triệu"' : 'Tìm sản phẩm thể thao...'}
                className={`w-full pl-11 pr-14 py-2.5 bg-slate-100/50 border-none rounded-full text-sm font-medium focus:ring-2 focus:bg-white transition-all outline-none ${
                  aiMode ? 'ring-indigo-500/30' : 'focus:ring-indigo-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setAiMode(!aiMode)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  aiMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white text-slate-400 shadow-sm hover:text-indigo-600'
                }`}
              >
                AI
              </button>
            </form>

            {/* Suggestions with Animation */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                      {aiMode ? 'AI Results' : 'Quick Suggestions'}
                      {suggestLoading && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>}
                    </span>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {suggestions.map(p => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => { setShowSuggestions(false); setSearchInput(''); }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                          <img
                            src={p.imageUrl || `https://picsum.photos/seed/${p.id}/80/80`}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-indigo-600 font-black uppercase tracking-tighter">
                            {p.price?.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                        {aiMode && p.similarity && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-black">
                              {Math.round(p.similarity * 100)}%
                            </span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown token={token} />
            
            <NavLink to="/cart" className="relative p-2.5 text-slate-600 hover:text-indigo-600 transition-colors group">
              <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {token ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-inner group">
                  <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
                <button 
                  onClick={logout}
                  className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary !px-5 !py-2 text-sm"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
