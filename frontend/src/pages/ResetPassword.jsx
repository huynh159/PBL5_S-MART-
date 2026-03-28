import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';
import { KeyRound } from 'lucide-react';

function ResetPassword() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // Nếu không có email (do truy cập url trực tiếp thay vì bấn nút từ forgot-password), đá về trang forgot
  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  const handleReset = async (e) => {
    e.preventDefault();

    if(otp.length !== 6) {
      toast.warning("Mã OTP phải có đúng 6 chữ số!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      toast.success(response.message || "Đổi mật khẩu thành công!");
      // Chuyển hướng về trang đăng nhập
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Mã OTP lỗi hoặc đã hết hạn!";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
        Tạo mật khẩu mới
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Vui lòng nhập mã OTP được gửi vào email <span className="font-semibold">{email}</span> và mật khẩu mới của bạn.
      </p>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
            Mã OTP (6 số)
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="000000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Hủy & Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;

