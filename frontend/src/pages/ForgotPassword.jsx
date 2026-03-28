import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';
import { Mail } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || "OTP đã được gửi đến email của bạn!");

      // Thành công thì chuyển hướng sang màn hình nhập OTP đổi mật khẩu mới
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Không tìm thấy tài khoản email này!";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Quên mật khẩu?
      </h2>
      <p className="text-center text-sm text-gray-600 mb-8">
        Đừng lo lắng! Nhập email của bạn vào bên dưới và chúng tôi sẽ gửi mã khôi phục cho bạn.
      </p>

      <form onSubmit={handleForgot} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email đã đăng ký</label>
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang gửi email..." : "Gửi mã khôi phục"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          &larr; Quay lại trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;

