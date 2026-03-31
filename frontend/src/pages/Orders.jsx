import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getMyOrders();
        // Giả sử backend trả về 1 mảng các đơn hàng đã sort theo ngày mới nhất
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate]);

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'Đã thanh toán';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'PENDING': return 'Chờ xử lý';
      default: return status || 'Không rõ';
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải lịch sử mua hàng...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 md:p-8 rounded-2xl shadow-sm mb-10">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <Package className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Lịch Sử Mua Hàng</h1>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg mb-6">{error}</div>}

      {orders.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Bạn chưa có đơn hàng nào.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Mã Đơn: #{order.id}</h3>
                  <p className="text-sm text-gray-500">
                    Ngày đặt: {new Date(order.createdAt || order.orderDate).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border">
                  {getStatusIcon(order.status)}
                  <span className="font-medium text-gray-700">{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
                <p><strong>Giao đến:</strong> {order.address}</p>
                <p><strong>SĐT:</strong> {order.phone}</p>
                {order.note && <p><strong>Ghi chú:</strong> {order.note}</p>}
                <p><strong>Phương thức:</strong> {order.paymentMethod || 'VNPAY'}</p>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4 mt-4">
                {order.orderDetails && order.orderDetails.map((detail, idx) => (
                  <div key={idx} className="flex justify-between items-center text-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{detail.product?.name || 'Sản phẩm'}</span>
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">x{detail.quantity}</span>
                    </div>
                    <span>{(detail.price * detail.quantity).toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Tổng tiền thanh toán:</span>
                <span className="text-xl font-bold text-blue-600">
                  {order.totalAmount ? order.totalAmount.toLocaleString('vi-VN') : '0'} ₫
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

