import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';
function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  useEffect(() => {
    if (!email) {
      toast.error('Không tìm thấy email cần xác thực. Vui lòng quay lại!');
      navigate('/register');
      return;
    }
    if (timeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, email, navigate]);
  const handleVerify = async (e) => {
    e.preventDefault();
    if(otp.length !== 6) {
      toast.warning('Mã OTP phải có đúng 6 chữ số!');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(email, otp);
      toast.success(response.message || 'Xác thực thành công!');
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  // Định dạng thời gian (Format time) từ giây sang MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div>
      <h2 className='text-3xl font-bold text-center text-gray-800 mb-6 border-b pb-4'>
        Xác thực Email
      </h2>
      <p className='text-center text-gray-600 mb-6 text-sm leading-relaxed'>
        Chúng tôi đã gửi một mã gồm <span className='font-bold text-gray-800'>6 số</span> đến email: <br/> 
        <span className='text-blue-600 font-semibold'>{email}</span>
      </p>
      <form onSubmit={handleVerify} className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2 text-center'>
            Nhập mã OTP
          </label>
          <input
            type='text'
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            className='w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            placeholder='000000'
            required
          />
        </div>
        <div className='text-center text-sm'>
          {timeLeft > 0 ? (
            <p className='text-gray-500'>
              Mã sẽ hết hạn sau: <span className='text-red-500 font-bold'>{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className='text-red-600 font-medium'>Mã OTP đã hết hạn!</p>
          )}
        </div>
        <button
          type='submit'
          disabled={isLoading || timeLeft === 0}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
        </button>
      </form>
      <div className='mt-6 text-center'>
        <Link to='/login' className='text-sm text-gray-500 hover:text-gray-800 underline'>
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
export default VerifyOtp;
