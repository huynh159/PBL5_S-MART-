import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import api from '../services/api';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận',    color: 'text-yellow-600', icon: Clock },
  PAID:      { label: 'Đã thanh toán',   color: 'text-yellow-600', icon: Clock },
  PROCESSING:{ label: 'Đang chuẩn bị',   color: 'text-blue-600',   icon: Clock },
  SHIPPED:   { label: 'Đang giao',       color: 'text-purple-600', icon: Package },
  DELIVERED: { label: 'Đã giao',         color: 'text-green-600',  icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành',      color: 'text-green-600',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',          color: 'text-red-500',    icon: XCircle },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);

  const { token } = useAuth();
  const navigate = useNavigate();
  const stompClientRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getMyOrders();
      setOrders(data.sort((a,b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)));
    } catch (err) {
      console.error(err);
      setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();

    const initWebSocket = async () => {
        try {
          // Lấy ID thật của user từ server
          const userRes = await api.get('/auth/me').catch(() => null);
          let uid = null;
          if (userRes && userRes.data && userRes.data.id) {
             uid = userRes.data.id;
          } else {
             const decoded = jwtDecode(token);
             uid = decoded.userId || decoded.id || decoded.sub;
          }

          if (!uid) return;
          const [{ Client }, SockJSModule] = await Promise.all([
            import('@stomp/stompjs'),
            import('sockjs-client')
          ]);
          const SockJS = SockJSModule.default || SockJSModule;
            const client = new Client({
              webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
              debug: () => {},
              onConnect: () => {
                client.subscribe(`/topic/user-${uid}`, (msg) => {
                  if (msg.body) {
                    // Xóa phần hiển thị toast ở đây để không bị trùng lặp hiển thị ở góc phải nữa
                    fetchOrders();
                  }
                });
              }
            });
          client.activate();
          stompClientRef.current = client;
        } catch (e) {
           console.log("WebSocket connect err: ", e);
        }
    };
    initWebSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [token, navigate]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) {
      return;
    }
    try {
      setCancelingId(orderId);
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Đã hủy đơn hàng thành công');
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng này');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải lịch sử mua hàng...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm mb-10 min-h-screen">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Lịch Sử Mua Hàng</h1>
        </div>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg mb-6 shadow-sm border border-red-100">{error}</div>}

      {orders.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">Bạn chưa có đơn hàng nào.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const orderItems = order.orderItems || order.orderDetails || [];

            // Chỉ cho hủy khi PENDING, PAID, hoặc PROCESSING
            const canCancel = ['PENDING', 'PAID', 'PROCESSING'].includes(order.status?.toUpperCase());

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Mã đơn: #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {new Date(order.createdAt || order.orderDate).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 ${statusInfo.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-semibold">{statusInfo.label}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  {orderItems.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-gray-200 rounded justify-center items-center overflow-hidden">
                             <img src={detail.product?.imageUrl || ''} alt={detail.product?.name} className="w-full h-full object-cover"/>
                         </div>
                         <div>
                          <div className="font-medium text-gray-800">{detail.product?.name || 'Sản phẩm'}</div>
                          {(detail.color || detail.size) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                  Phân loại: {detail.color} {detail.color && detail.size ? ',' : ''} {detail.size}
                              </div>
                          )}
                          <div className="text-sm text-gray-500">{(detail.price || detail.product?.price || 0).toLocaleString('vi-VN')} ₫</div>
                          <div className="text-sm font-medium mt-1">x{detail.quantity}</div>
                         </div>
                      </div>
                      <span className="font-semibold text-blue-600">{((detail.price || detail.product?.price || 0) * detail.quantity).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600 mb-6">
                  <div>
                    <span className="text-gray-400">Người nhận:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.address || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Điện thoại:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Thanh toán:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.paymentMethod}</span>
                  </div>
                  {order.note && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Ghi chú:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.note}</span>
                  </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelingId === order.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancelingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-medium mr-3">Tổng số tiền:</span>
                    <span className="text-2xl font-bold text-red-500">
                      {(order.totalAmount || order.total || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;

