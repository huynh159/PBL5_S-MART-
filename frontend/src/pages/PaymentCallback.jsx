import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending'); // 'success', 'failed'

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Lấy tất cả query params VNPay đẩy về
        const responseCode = searchParams.get('vnp_ResponseCode');

        // Note: Ở hệ thống thật, Backend sẽ tự đón API này.
        // Nếu làm ở Frontend, ta có thể tự đọc ResponseCode. '00' là thành công.
        if (responseCode === '00') {
          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang xử lý kết quả thanh toán...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Thanh Toán Thành Công!</h1>
            <p className="text-gray-600 mb-8">Cảm ơn bạn đã mua sắm tại S-Mart. Đơn hàng của bạn đang được chuẩn bị.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/orders" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                Xem đơn hàng
              </Link>
              <Link to="/" className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
                Về trang chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Thanh Toán Thất Bại</h1>
            <p className="text-gray-600 mb-8">Giao dịch của bạn đã bị hủy hoặc có lỗi xảy ra trong quá trình thanh toán.</p>
            <button
              onClick={() => navigate('/cart')}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Quay lại giỏ hàng
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;

