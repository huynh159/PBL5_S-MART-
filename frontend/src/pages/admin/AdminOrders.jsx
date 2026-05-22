import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileText, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Search, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { io } from 'socket.io-client';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận',    color: 'yellow', icon: Clock },
  PAID:      { label: 'Đã thanh toán',   color: 'teal',   icon: CheckCircle },
  CONFIRMED: { label: 'Đang chuẩn bị',   color: 'blue',   icon: Clock },
  SHIPPING:  { label: 'Đang giao',       color: 'purple', icon: Clock },
  DELIVERED: { label: 'Đã giao',         color: 'green',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',          color: 'red',    icon: XCircle },
};

const colorClasses = {
  yellow: 'bg-yellow-100 text-yellow-700',
  teal:   'bg-teal-100 text-teal-700',
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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
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

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socket.on('adminNotification', () => {
      fetchOrders();
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchOrders(); // Refresh the list
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
      console.error(err);
    }
  };

  const filtered = orders.filter(o => {
    const statusUpper = o.status ? o.status.toUpperCase() : '';
    const matchStatus = filter === 'ALL' || statusUpper === filter;
    if (!matchStatus) return false;

    if (!searchQuery) return true;

    // Tìm kiếm theo ID đơn hàng, Số điện thoại, Email khách hoặc Địa chỉ
    const query = searchQuery.toLowerCase();
    const matchId = String(o.id).includes(query);
    const matchPhone = o.phone && o.phone.toLowerCase().includes(query);
    const matchEmail = o.user?.email && o.user.email.toLowerCase().includes(query);
    const matchAddress = o.address && o.address.toLowerCase().includes(query);

    return matchId || matchPhone || matchEmail || matchAddress;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusInfo = (status) => STATUS_MAP[status?.toUpperCase()] || STATUS_MAP.PENDING;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h1>
          <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
            {filtered.length} đơn hàng
          </span>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition"
            placeholder="Tìm mã đơn, SĐT, Email, Địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map(s => (
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
                ({orders.filter(o => (o.status && o.status.toUpperCase()) === s).length})
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
                className="flex flex-col md:flex-row md:items-center justify-between p-5 cursor-pointer hover:bg-gray-50/70 transition gap-4"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Đơn hàng #{order.id}</h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-sm">
                       <UserIcon className="w-4 h-4 text-gray-400" />
                       <span className="font-medium text-gray-700">{order.user?.email || 'Khách vãng lai'}</span>
                       <span className="text-gray-300">|</span>
                       <span className="text-gray-600">{order.phone || 'Chưa cập nhật SĐT'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                    <span className="text-xl font-bold text-blue-600">
                      {(order.total || order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colorClasses[statusInfo.color]}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-gray-500 mb-1 text-xs uppercase font-semibold">Khách hàng</p>
                      <p className="font-medium text-gray-800">{order.user?.email || '—'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-gray-500 mb-1 text-xs uppercase font-semibold">Liên hệ</p>
                      <p className="font-medium text-gray-800">{order.phone || '—'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-gray-500 mb-1 text-xs uppercase font-semibold">Giao hàng đến</p>
                      <p className="font-medium text-gray-800">{order.address || '—'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-gray-500 mb-1 text-xs uppercase font-semibold">Thanh toán</p>
                      <p className="font-medium text-gray-800">{order.paymentMethod || 'COD'}</p>
                    </div>
                    {(order.couponId || order.note) && (
                      <div className="lg:col-span-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex flex-wrap gap-6">
                        {order.couponId && <div><span className="text-gray-500 font-medium">Mã giảm giá áp dụng:</span> <span className="font-bold text-yellow-700">#{order.couponId}</span></div>}
                        {order.note && <div><span className="text-gray-500 font-medium">Ghi chú của khách:</span> <span className="italic text-gray-700">"{order.note}"</span></div>}
                      </div>
                    )}
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
                    {(order.status?.toUpperCase() === 'PENDING') && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Xác nhận đơn</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">Hủy đơn</button>
                      </>
                    )}
                    {order.status?.toUpperCase() === 'PAID' && (
                      <>
                        <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-3 py-2 rounded-lg">💰 Đã thanh toán VNPay</span>
                        <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Xác nhận & Chuẩn bị</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">Hủy đơn (Hoàn tiền)</button>
                      </>
                    )}
                    {order.status?.toUpperCase() === 'CONFIRMED' && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'SHIPPING')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">Giao hàng (Shipping)</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">Hủy đơn</button>
                      </>
                    )}
                    {order.status?.toUpperCase() === 'SHIPPING' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Xác nhận đã giao (Delivered)</button>
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
