import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';
import { KeyRound, Mail } from 'lucide-react';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation cơ bản (Basic validation)
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(email, password);
      toast.success(response.message || "Đăng ký thành công! Vui lòng kiểm tra email.");

      // Chuyển hướng kèm theo dữ liệu (State passing)
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi đăng ký. Vui lòng thử lại!";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 border-b pb-4">
        S-Mart
      </h2>
      <h3 className="text-xl font-semibold mb-6 text-gray-700 text-center">
        Đăng ký tài khoản mới
      </h3>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="nguyenvana@gmail.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Bạn đã có tài khoản?{' '}
        <Link to="/login" className="text-green-600 font-bold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}

export default Register;

