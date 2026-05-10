import { Mail, Phone, MapPin, Globe, Send, Camera, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

// Local SVG icons for social media since they might be missing in some lucide-react versions
const Facebook = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Twitter = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const Instagram = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const Youtube = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-2xl font-display font-black tracking-tighter">
                M<span className="text-indigo-400">A</span>RT
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              S-Mart cung cấp trang bị thể thao cao cấp nhất cho mọi vận động viên. Khơi dậy đam mê, chinh phục đỉnh cao.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-1 after:bg-indigo-600 after:mt-2 block">
              Dịch Vụ
            </h4>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Chính sách bảo hành</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Trung tâm hỗ trợ</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Giao hàng & Hoàn trả</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-1 after:bg-indigo-600 after:mt-2 block">
              Liên Hệ
            </h4>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>Số 54, Nguyễn Lương Bằng, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-400" />
                <span>+84 (0) 123 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <span>support@s-mart.vn</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-1 after:bg-indigo-600 after:mt-2 block">
              Bản Tin
            </h4>
            <p className="text-slate-400 text-sm mb-4">Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên của bạn.</p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email của bạn" 
                  className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                />
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                Đăng Ký Ngay
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <p>&copy; 2026 S-MART SPORT SHOP. POWERED BY ANTIGRAVITY.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
