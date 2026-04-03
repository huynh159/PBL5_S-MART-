import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileText, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận',    color: 'yellow', icon: Clock },
  PROCESSING:{ label: 'Đang chuẩn bị',   color: 'blue',   icon: Clock },
  SHIPPED:   { label: 'Đang giao',       color: 'purple', icon: Clock },
  DELIVERED: { label: 'Đã giao',         color: 'green',  icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành',      color: 'green',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',          color: 'red',    icon: XCircle },
};

const colorClasses = {
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      // Changed endpoint from '/admin/orders' to '/orders/admin' to match backend
      const res = await api.get('/orders/admin');
      setOrders(res.data);
    } catch (err) {
      toast.error('Lỗi tải danh sách đơn hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/admin/${id}/status?status=${newStatus}`);
      toast.success('Cập nhật trạng thái thành công!');
      fetchOrders(); // Refresh the list
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
      console.error(err);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const getStatusInfo = (status) => STATUS_MAP[status?.toUpperCase()] || STATUS_MAP.PENDING;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h1>
        <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
          {orders.length} đơn hàng
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : (STATUS_MAP[s]?.label || s)}
            {s !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border shadow-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border shadow-sm">Không có đơn hàng nào</div>
        ) : filtered.map(order => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedId === order.id;

          return (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/70 transition"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">Đơn hàng #{order.id}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                    </p>
                    {order.address && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {order.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-blue-600">
                    {(order.total || order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                  </span>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colorClasses[statusInfo.color]}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusInfo.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div><span className="text-gray-500">Phương thức:</span> <span className="font-medium">{order.paymentMethod || 'COD'}</span></div>
                    <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{order.phone || '—'}</span></div>
                    {order.couponId && <div><span className="text-gray-500">Coupon ID:</span> <span className="font-medium">#{order.couponId}</span></div>}
                    {order.note && <div><span className="text-gray-500">Ghi chú:</span> <span className="font-medium">{order.note}</span></div>}
                  </div>

                  {order.orderItems?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Chi tiết sản phẩm:</p>
                      {order.orderItems.map((d, i) => (
                        <div key={i} className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-100">
                          <div>
                              <span className="font-medium text-gray-700">{d.product?.name || `Sản phẩm #${d.productId || ''}`}</span>
                              {(d.color || d.size) && (
                                  <p className="text-xs text-gray-500 mt-1">
                                      Phân loại: {d.color} {d.color && d.size ? ',' : ''} {d.size}
                                  </p>
                              )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">x{d.quantity}</span>
                            <span className="font-semibold text-gray-800">
                              {((d.price || d.product?.price || 0) * d.quantity).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions for Admin Workflow */}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                    {(order.status === 'PENDING' || order.status === 'PAID') && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'PROCESSING')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Chuẩn bị hàng</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">Hủy đơn</button>
                      </>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'SHIPPED')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">Giao hàng (Shipped)</button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Xác nhận Đã giao</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOrders;
