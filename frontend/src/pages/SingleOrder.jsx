import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận',    color: 'text-yellow-600', icon: Clock },
  PAID:      { label: 'Đã thanh toán',   color: 'text-yellow-600', icon: Clock },
  PROCESSING:{ label: 'Đang chuẩn bị',   color: 'text-blue-600',   icon: Clock },
  SHIPPED:   { label: 'Đang giao',       color: 'text-purple-600', icon: Package },
  DELIVERED: { label: 'Đã giao',         color: 'text-green-600',  icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành',      color: 'text-green-600',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',          color: 'text-red-500',    icon: XCircle },
};

const SingleOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (e) {
        setError('Không tìm thấy đơn hàng hoặc bạn không có quyền xem!');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, token, navigate]);

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải đơn hàng...</div>;

  if (error || !order) return (
    <div className="max-w-4xl mx-auto mt-10 text-center py-20 bg-gray-50 rounded-2xl border">
      <p className="text-red-500 font-medium mb-4">{error}</p>
      <button onClick={() => navigate('/orders')} className="text-blue-600 font-medium hover:underline">Quay lại danh sách</button>
    </div>
  );

  const statusInfo = STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
  const StatusIcon = statusInfo.icon;
  const orderItems = order.orderItems || order.orderDetails || [];

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm mb-10 min-h-screen">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
         <ArrowLeft className="w-5 h-5" /> <span>Quay lại Lịch sử đơn hàng</span>
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Chi Tiết Đơn Hàng #{order.id}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Ngày đặt: {new Date(order.createdAt || order.orderDate).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-100 ${statusInfo.color} bg-gray-50`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-semibold">{statusInfo.label}</span>
          </div>
        </div>

        <div className="space-y-4 mb-6 mt-4">
          <h4 className="font-bold text-gray-700 text-lg mb-3">Sản phẩm đã mua:</h4>
          {orderItems.map((detail, idx) => (
            <div key={idx} className="flex justify-between items-center text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-4">
                 <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-lg flex items-center justify-center p-2">
                     {detail.product?.imageUrl ? <img src={detail.product.imageUrl} alt={detail.product.name} className="w-full h-full object-contain" /> : <Package className="w-8 h-8 text-gray-300" />}
                 </div>
                 <div>
                  <div className="font-semibold text-gray-800 text-lg">{detail.product?.name || 'Sản phẩm'}</div>
                  <div className="text-sm text-gray-500 mt-1">Đơn giá: {(detail.price || detail.product?.price || 0).toLocaleString('vi-VN')} ₫</div>
                  <div className="text-sm font-medium mt-1 text-gray-600 border border-gray-200 bg-white inline-block px-2 py-0.5 rounded shadow-sm">SL: x{detail.quantity}</div>
                 </div>
              </div>
              <span className="font-bold text-blue-600 text-lg">
                {((detail.price || detail.product?.price || 0) * detail.quantity).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50/50 rounded-xl p-5 grid md:grid-cols-2 gap-4 mt-4 text-sm text-gray-700 border border-blue-100/50">
          <div><span className="text-gray-500">Người nhận:</span> <span className="ml-2 font-medium">{order.address || '—'}</span></div>
          <div><span className="text-gray-500">Điện thoại:</span> <span className="ml-2 font-medium">{order.phone || '—'}</span></div>
          <div><span className="text-gray-500">Thanh toán:</span> <span className="ml-2 font-medium text-blue-700">{order.paymentMethod}</span></div>
          {order.note && <div className="col-span-2"><span className="text-gray-500">Ghi chú:</span> <span className="ml-2 font-medium bg-yellow-50 text-yellow-800 px-3 py-1 rounded inline-block">{order.note}</span></div>}
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
          <div className="text-gray-500">Đơn hàng này được cập nhật theo thời gian thực.</div>
          <div className="text-right">
            <span className="text-gray-500 font-medium mr-3 text-lg">Tổng hóa đơn:</span>
            <span className="text-3xl font-black text-red-500">
              {(order.totalAmount || order.total || 0).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
