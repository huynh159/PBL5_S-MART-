import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';
import { KeyRound, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Hook chuyển trang (Routing parameter)

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn chặn form tải lại trang (Prevent Default)
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      toast.success(response.message || "Đăng nhập thành công!");
      // Chuyển hướng (Redirect) về trang chủ
      navigate('/');
    } catch (error) {
      // Xử lý lỗi (Error Handling)
      const errorMsg = error.response?.data?.message || "Lỗi đăng nhập. Vui lòng thử lại!";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await authService.googleLogin(credentialResponse.credential);
      toast.success(response.message || "Đăng nhập Google thành công!");
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi đăng nhập qua Google!";
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
        Đăng nhập tài khoản
      </h3>

      <form onSubmit={handleLogin} className="space-y-5">
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
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Bạn chưa có tài khoản?{' '}
        <Link to="/register" className="text-blue-600 font-bold hover:underline">
          Đăng ký ngay
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="border-b w-1/5 lg:w-1/4"></span>
        <span className="text-xs text-center text-gray-500 uppercase">Hoặc đăng nhập với</span>
        <span className="border-b w-1/5 lg:w-1/4"></span>
      </div>
      <div className="mt-4 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            toast.error("Đăng nhập Google thất bại!");
          }}
          useOneTap
        />
      </div>
    </div>
  );
}

export default Login;
